import {
  type Transport,
  type TransportSendOptions,
} from '@modelcontextprotocol/sdk/shared/transport.js';
import { JSONRPCMessageSchema, type JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import {
  type EventId,
  type MCPConnectOptions,
  type MCPEventMessage,
  type MCPReplayEventMessage,
  type MCPServerInfoMessage,
} from '../browser-types';

export const isJSONRPCMessage = (value: unknown): value is JSONRPCMessage =>
  JSONRPCMessageSchema.safeParse(value).success;

/**
 * Configuration options for reconnection behavior, mirroring BrowserReconnectionOptions
 */
export interface ExtensionReconnectionOptions {
  maxReconnectionDelay: number;
  initialReconnectionDelay: number;
  reconnectionDelayGrowFactor: number;
  maxRetries: number;
}

const DEFAULT_EXTENSION_RECONNECTION_OPTIONS: ExtensionReconnectionOptions = {
  initialReconnectionDelay: 1000,
  maxReconnectionDelay: 30000,
  reconnectionDelayGrowFactor: 1.5,
  maxRetries: 2,
};

/**
 * Configuration options for the ExtensionClientTransport
 */
export interface ExtensionClientTransportOptions {
  clientInstanceId?: string;
  reconnectionOptions?: ExtensionReconnectionOptions;
  connectionTimeout?: number;
}

export class ExtensionClientTransport implements Transport {
  onclose?: () => void;
  onerror?: (err: Error) => void;
  onmessage?: (message: JSONRPCMessage, extra?: { authInfo?: any }) => void;

  public isConnected = false;
  public sessionId?: string;
  public lastEventId?: EventId;
  public serverInstanceId?: string;
  public hasEventStore: boolean = false;
  public streamId?: string;

  private clientId: string;
  private bridge: ReturnType<typeof createUIBridge>;

  private _reconnectionOptions: ExtensionReconnectionOptions;
  private _connectionTimeout: number;
  private _abortController?: AbortController;
  private _connectionPromise?: {
    resolve: () => void;
    reject: (error: Error) => void;
  };
  private _reconnectAttempt: number = 0;
  private _startPromise?: Promise<void>;

  constructor(options?: ExtensionClientTransportOptions & { port?: chrome.runtime.Port }) {
    this.clientId =
      options?.clientInstanceId ||
      (crypto.randomUUID?.() ?? `ext-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

    this._reconnectionOptions =
      options?.reconnectionOptions ?? DEFAULT_EXTENSION_RECONNECTION_OPTIONS;
    this._connectionTimeout = options?.connectionTimeout ?? 30000;
    this.bridge = createUIBridge(options?.port);

    // Set up the message handler once for the lifetime of this transport
    this._setupMessageHandler();
  }

  private _setupMessageHandler(): void {
    this.bridge.onMessage((resp: BridgeResponse) => {
      console.log(
        `ExtensionClientTransport: Received message for client ${resp.clientId}`,
        'Expected client:',
        this.clientId,
        'Match:',
        resp.clientId === this.clientId,
        'Message type:',
        resp.msg && 'type' in resp.msg ? resp.msg.type : 'unknown'
      );

      // Only process messages for our client ID
      if (resp.clientId !== this.clientId) {
        console.log(
          `ExtensionClientTransport: Ignoring message for different client. Expected ${this.clientId}, got ${resp.clientId}`
        );
        return;
      }

      const data: PageBridgeMessageType = resp.msg;
      try {
        // HANDLE THE SERVER-SIDE DISCONNECT NOTIFICATION
        if ('type' in data && data.type === 'mcp-server-disconnected') {
          console.warn(
            `ExtensionClientTransport: Server for client ${this.clientId} disconnected unexpectedly.`
          );

          // If we thought we were connected, trigger the full close/reconnect cycle.
          if (this.isConnected) {
            this.isConnected = false; // Immediately update state
            const error = new Error('The server-side transport has disconnected.');

            // Re-use the existing connection error handler. It contains the logic
            // to attempt reconnection based on your options.
            this._handleConnectionError(error, this.lastEventId);
          }
          return;
        }

        if ('type' in data && data.type === 'mcp-server-info') {
          const serverInfo = data as MCPServerInfoMessage;
          console.log(
            `ExtensionClientTransport: Received server info for client ${this.clientId}`,
            serverInfo
          );

          // Only process if we're expecting a handshake (have a connection promise)
          if (this._connectionPromise) {
            this.sessionId = serverInfo.serverSessionId;
            this.serverInstanceId = serverInfo.serverInstanceId;
            this.hasEventStore = serverInfo.hasEventStore || false;
            this.streamId = serverInfo.streamId;
            this.isConnected = true;
            this._reconnectAttempt = 0;
            const promise = this._connectionPromise;
            this._connectionPromise = undefined;
            promise.resolve();
          } else {
            console.warn(
              `ExtensionClientTransport: Received server info but no connection promise pending`
            );
          }
          return;
        }

        // Only process other messages if we're connected
        if (!this.isConnected) {
          console.warn('ExtensionClientTransport: Received message while not connected', data);
          return;
        }

        // Handle messages after connection established
        if ('type' in data && (data.type === 'mcp-replay-event' || data.type === 'mcp-event')) {
          const eventMsg = data as MCPEventMessage | MCPReplayEventMessage;
          this.lastEventId = eventMsg.eventId;
          if (isJSONRPCMessage(eventMsg.message)) {
            this.onmessage?.(eventMsg.message);
          } else {
            const message = JSONRPCMessageSchema.parse(eventMsg.message);
            this.onmessage?.(message);
          }
        } else if (isJSONRPCMessage(data)) {
          // Check if it's a direct JSONRPCMessage
          this.onmessage?.(data);
        } else {
          console.warn('ExtensionClientTransport received unknown message type:', data);
        }
      } catch (err) {
        const error = err as Error;
        console.error(
          'Error processing message in ExtensionClientTransport:',
          error,
          'Data:',
          data
        );
        this.onerror?.(error);
      }
    });
  }

  async start(): Promise<void> {
    if (this._startPromise) {
      console.warn(
        'ExtensionClientTransport already started, returning existing connection promise'
      );
      return this._startPromise;
    }

    if (this._abortController) {
      console.warn('ExtensionClientTransport already started!');
      // If we have an abort controller but no start promise, we're in an inconsistent state
      // Return a resolved promise if connected, otherwise create a new connection
      if (this.isConnected) {
        return Promise.resolve();
      }
    }

    this._abortController = new AbortController();
    this._startPromise = this._connectWithRetry().finally(() => {
      // Clear the start promise once connection attempt completes (success or failure)
      this._startPromise = undefined;
    });

    return this._startPromise;
  }

  private async _connectWithRetry(resumptionToken?: EventId): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._connectionPromise = { resolve, reject };
      let handshakeTimer: ReturnType<typeof setTimeout>;

      const signal = this._abortController?.signal;
      if (signal?.aborted) {
        return reject(new Error('Connection aborted'));
      }

      console.log(
        `ExtensionClientTransport: Starting connection for client ${this.clientId}`,
        resumptionToken ? `with resumption token ${resumptionToken}` : 'without resumption token'
      );

      // Message handler is already set up in constructor

      const connectOptions: MCPConnectOptions | undefined = resumptionToken
        ? { resumeFrom: resumptionToken }
        : undefined;

      console.log(
        `ExtensionClientTransport: Sending connect command for client ${this.clientId}`,
        connectOptions
      );
      this.bridge.connect(this.clientId, connectOptions);

      handshakeTimer = setTimeout(() => {
        if (!this.isConnected && this._connectionPromise) {
          const error = new Error(
            `ExtensionClientTransport: Server handshake timeout for client ${this.clientId}`
          );
          this._handleConnectionError(error, resumptionToken);
        }
      }, this._connectionTimeout);

      // Store handshake timer reference so it can be cleared when connection succeeds
      const originalResolve = this._connectionPromise.resolve;
      this._connectionPromise.resolve = () => {
        if (handshakeTimer) clearTimeout(handshakeTimer);
        originalResolve();
      };

      signal?.addEventListener('abort', () => {
        if (handshakeTimer) clearTimeout(handshakeTimer);
        // If connectionPromise still exists, it means we haven't resolved/rejected it yet.
        if (this._connectionPromise) {
          this._connectionPromise.reject(new Error('Connection aborted during handshake'));
          this._connectionPromise = undefined;
        }
      });
    });
  }

  private _handleConnectionError(error: Error, resumptionToken?: EventId): void {
    this.onerror?.(error);
    this.isConnected = false; // Ensure disconnected state

    if (this._connectionPromise) {
      this._connectionPromise.reject(error);
      this._connectionPromise = undefined;
    }

    // Attempt reconnection if appropriate (not aborted and lastEventId exists for resumption)
    const shouldRetry =
      this._abortController &&
      !this._abortController.signal.aborted &&
      (resumptionToken || this.lastEventId) && // Need a token to resume
      this._reconnectionOptions.maxRetries > 0 &&
      this._reconnectAttempt < this._reconnectionOptions.maxRetries;

    if (shouldRetry) {
      this._scheduleReconnection(resumptionToken || this.lastEventId!);
    } else {
      // If no retry, call onclose if it was previously connected or trying to connect
      // This prevents calling onclose if start() was never called or already closed.
      if (this._abortController) {
        // Check if connection process was initiated
        this.onclose?.();
        // Clean up abort controller as we are fully stopping
        this._abortController = undefined;
      }
    }
  }

  private _getNextReconnectionDelay(attempt: number): number {
    const { initialReconnectionDelay, maxReconnectionDelay, reconnectionDelayGrowFactor } =
      this._reconnectionOptions;
    return Math.min(
      initialReconnectionDelay * Math.pow(reconnectionDelayGrowFactor, attempt),
      maxReconnectionDelay
    );
  }

  private _scheduleReconnection(tokenToResume: EventId): void {
    const delay = this._getNextReconnectionDelay(this._reconnectAttempt);
    this._reconnectAttempt++;

    console.log(
      `ExtensionClientTransport: Scheduling reconnection attempt ${this._reconnectAttempt} in ${delay}ms`
    );

    setTimeout(() => {
      if (this._abortController?.signal.aborted) {
        console.log('ExtensionClientTransport: Reconnection aborted.');
        return;
      }
      console.log(
        `ExtensionClientTransport: Attempting reconnection (attempt ${this._reconnectAttempt})`
      );
      this._connectWithRetry(tokenToResume).catch((err) => {
        // Error during a scheduled reconnection attempt is handled by _handleConnectionError within that attempt.
        // We log it here for visibility, but _handleConnectionError will decide on further retries or final close.
        console.error(`ExtensionClientTransport: Scheduled reconnection attempt failed:`, err);
        // If _handleConnectionError doesn't schedule another retry, it will call onclose.
      });
    }, delay);
  }

  async send(message: JSONRPCMessage, _?: TransportSendOptions): Promise<void> {
    // options?.resumptionToken and options?.onresumptiontoken are not directly applicable here
    // as the extension bridge manages its own event stream concept via lastEventId internally.

    // If there's a start promise pending, wait for it
    if (this._startPromise) {
      console.log('ExtensionClientTransport: Waiting for initial connection before send.');
      try {
        await this._startPromise;
      } catch (err) {
        const error = new Error(
          `ExtensionClientTransport: Failed to establish initial connection: ${err instanceof Error ? err.message : String(err)}`
        );
        this.onerror?.(error);
        throw error;
      }
    }

    if (!this.isConnected) {
      const canAttemptReconnect =
        this._reconnectionOptions.maxRetries > 0 &&
        this.lastEventId &&
        this._abortController &&
        !this._abortController.signal.aborted;
      if (canAttemptReconnect) {
        console.log(
          'ExtensionClientTransport: Not connected. Attempting auto-reconnect before send.'
        );
        try {
          await this._connectWithRetry(this.lastEventId);
        } catch (err) {
          const reconErr = new Error(
            `ExtensionClientTransport: Failed to auto-reconnect before send: ${err instanceof Error ? err.message : String(err)}`
          );
          this.onerror?.(reconErr);
          throw reconErr; // Propagate error if reconnection fails
        }
        if (!this.isConnected) {
          throw new Error(
            'ExtensionClientTransport: Not connected after attempting auto-reconnection.'
          );
        }
      } else {
        throw new Error('ExtensionClientTransport: Not connected and cannot auto-reconnect.');
      }
    }
    this.bridge.send(this.clientId, message);
  }

  async close(): Promise<void> {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = undefined; // Clear it as we are now closed
    }

    if (this._connectionPromise) {
      this._connectionPromise.reject(
        new Error('ExtensionClientTransport: Transport closed by client.')
      );
      this._connectionPromise = undefined;
    }

    // Clear any pending start promise
    this._startPromise = undefined;

    // Future: If bridge supported explicit disconnect message:
    // if (this.isConnected) { // Or even if not, to clean up server-side if client ID is known
    //   this.bridge.disconnect(this.clientId); // This would need to be added to UIBridge and handled by background
    // }

    this.isConnected = false;
    // Only call onclose if it hasn't been called by _handleConnectionError already
    // However, a direct call to close() should always trigger onclose if not already closed.
    // The _abortController being undefined (set by _handleConnectionError on final failure or here on direct close)
    // can be a guard. If _handleConnectionError already cleaned up, onclose was called.
    // For simplicity now: always call onclose, assuming it handles multiple calls gracefully or is only set once.
    this.onclose?.();
  }
}
