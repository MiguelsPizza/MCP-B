import { type Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { JSONRPCMessageSchema, type JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import {
  type EventId,
  type MCPBrowserInterface,
  type MCPConnectOptions,
  type MCPEventMessage,
  type MCPReplayEventMessage,
  type MCPServerInfoMessage,
  type MCPWindow,
} from '../browser-types.js';

/**
 * Browser-specific error class to match StreamableHTTPError
 */
export class BrowserTransportError extends Error {
  constructor(
    public readonly code: string | undefined,
    message: string | undefined
  ) {
    super(`Browser transport error: ${message}`);
  }
}

/**
 * Configuration options for the BrowserClientTransport, matching StreamableHTTPClientTransportOptions style
 */
export interface TabClientTransportOptions {
  /**
   * A unique identifier for this client instance. If not provided, one will be generated.
   * This is similar to a persistent client identifier.
   */
  clientInstanceId?: string;

  /**
   * Global namespace to look for MCP server (defaults to 'mcp')
   */
  globalNamespace?: string;

  /**
   * Options to configure the reconnection behavior.
   */
  reconnectionOptions?: BrowserReconnectionOptions;

  /**
   * Timeout for initial connection handshake (ms). Default is 30000 (30 seconds).
   */
  connectionTimeout?: number;
}

/**
 * Configuration options for reconnection behavior
 */
export interface BrowserReconnectionOptions {
  /**
   * Maximum backoff time between reconnection attempts in milliseconds.
   * Default is 30000 (30 seconds).
   */
  maxReconnectionDelay: number;

  /**
   * Initial backoff time between reconnection attempts in milliseconds.
   * Default is 1000 (1 second).
   */
  initialReconnectionDelay: number;

  /**
   * The factor by which the reconnection delay increases after each attempt.
   * Default is 1.5.
   */
  reconnectionDelayGrowFactor: number;

  /**
   * Maximum number of reconnection attempts before giving up.
   * Default is 2.
   */
  maxRetries: number;
}

// Default reconnection options matching StreamableHTTP
const DEFAULT_BROWSER_RECONNECTION_OPTIONS: BrowserReconnectionOptions = {
  initialReconnectionDelay: 1000,
  maxReconnectionDelay: 30000,
  reconnectionDelayGrowFactor: 1.5,
  maxRetries: 2,
};

/**
 * Client transport for browser environments using window.mcp global.
 * This implementation follows the same patterns as StreamableHTTPClientTransport.
 */
export class TabClientTransport implements Transport {
  private _globalNamespace: string;
  /**
   * The client's persistent instance ID
   */
  public clientInstanceId: string;
  /**
   * The session ID provided by the server during connection
   */
  public sessionId?: string;
  private _reconnectionOptions: BrowserReconnectionOptions;
  private _connectionTimeout: number;

  private _port?: MessagePort;
  /**
   * The server's instance ID, received during handshake.
   */
  public serverInstanceId?: string;
  public hasEventStore: boolean = false;
  public streamId?: string;
  /**
   * Indicates whether the transport is currently connected.
   */
  public isConnected: boolean = false;
  private _abortController?: AbortController; // For consistency with StreamableHTTP
  private _connectionPromise?: {
    resolve: () => void;
    reject: (error: Error) => void;
  };
  /**
   * The last event ID received from the server.
   */
  public lastEventId?: EventId;
  private _reconnectAttempt: number = 0;

  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;

  constructor(opts?: TabClientTransportOptions) {
    this._globalNamespace = opts?.globalNamespace ?? 'mcp';
    this._reconnectionOptions = opts?.reconnectionOptions ?? DEFAULT_BROWSER_RECONNECTION_OPTIONS;
    this._connectionTimeout = opts?.connectionTimeout ?? 30000;

    this.clientInstanceId =
      opts?.clientInstanceId ||
      (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  }

  /**
   * Start the transport connection
   */
  async start(): Promise<void> {
    if (this._abortController) {
      throw new Error(
        'TabClientTransport already started! If using Client class, note that connect() calls start() automatically.'
      );
    }

    this._abortController = new AbortController();
    await this._connectWithRetry();
  }

  /**
   * Internal method to establish connection with retry logic
   */
  private async _connectWithRetry(resumptionToken?: EventId): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._connectionPromise = { resolve, reject };

      const windowWithMcp = window as MCPWindow;
      const mcp: MCPBrowserInterface | undefined =
        this._globalNamespace === 'mcp'
          ? windowWithMcp.mcp
          : (windowWithMcp as any)[this._globalNamespace];

      if (!mcp?.isServerAvailable?.()) {
        const error = new BrowserTransportError(
          'NO_SERVER',
          `No MCP server found at window.${this._globalNamespace}`
        );
        this._handleConnectionError(error, resumptionToken);
        return;
      }

      // Get server info
      const serverInfo = mcp.getServerInfo();
      this.serverInstanceId = serverInfo.instanceId;

      // Request connection with optional resume
      const connectOptions: MCPConnectOptions | undefined = resumptionToken
        ? { resumeFrom: resumptionToken }
        : undefined;

      const clientPort = mcp.connect(this.clientInstanceId, connectOptions);
      if (!clientPort) {
        const error = new BrowserTransportError(
          'CONNECTION_FAILED',
          'Failed to connect to MCP server'
        );
        this._handleConnectionError(error, resumptionToken);
        return;
      }

      this._port = clientPort;
      let handshakeComplete = false;
      let handshakeTimer: ReturnType<typeof setTimeout>;

      // Set up message handling
      this._port.onmessage = (event: MessageEvent) => {
        const data = event.data;

        // Handle server info handshake
        if (!handshakeComplete && data.type === 'mcp-server-info') {
          const serverInfo = data as MCPServerInfoMessage;
          clearTimeout(handshakeTimer);
          handshakeComplete = true;
          this.sessionId = serverInfo.serverSessionId;
          this.hasEventStore = serverInfo.hasEventStore || false;
          this.streamId = serverInfo.streamId;
          this.isConnected = true;
          this._reconnectAttempt = 0; // Reset on successful connection

          if (this._connectionPromise) {
            this._connectionPromise.resolve();
            this._connectionPromise = undefined;
          }
          return;
        }

        // Handle replay events during resumption
        if (data.type === 'mcp-replay-event') {
          const replayEvent = data as MCPReplayEventMessage;
          this.lastEventId = replayEvent.eventId;
          this._handleMessage(replayEvent.message);
          return;
        }

        // Handle regular events with event IDs
        if (data.type === 'mcp-event') {
          const eventMessage = data as MCPEventMessage;
          this.lastEventId = eventMessage.eventId;
          this._handleMessage(eventMessage.message);
          return;
        }

        // Handle regular JSON-RPC messages (backward compatibility)
        if (handshakeComplete) {
          this._handleMessage(data);
        }
      };

      this._port.onmessageerror = () => {
        const error = new BrowserTransportError('MESSAGE_ERROR', 'MessagePort error');
        this.onerror?.(error);
        if (this._connectionPromise) {
          this._connectionPromise.reject(error);
          this._connectionPromise = undefined;
        }
      };

      // Note: MessagePort doesn't have an onclose event
      // Connection loss will be detected through other means (e.g., send failures)

      // Start the port
      this._port.start();

      // Set handshake timeout
      handshakeTimer = setTimeout(() => {
        if (!handshakeComplete) {
          const error = new BrowserTransportError('HANDSHAKE_TIMEOUT', 'Server handshake timeout');
          this._handleConnectionError(error, resumptionToken);
        }
      }, this._connectionTimeout);
    });
  }

  /**
   * Handle incoming messages with error handling
   */
  private _handleMessage(data: unknown): void {
    try {
      const message = JSONRPCMessageSchema.parse(data);
      this.onmessage?.(message);
    } catch (error) {
      this.onerror?.(new Error(`Failed to parse message: ${error}`));
    }
  }

  /**
   * Handle connection errors with retry logic
   */
  private _handleConnectionError(error: Error, resumptionToken?: EventId): void {
    this.onerror?.(error);

    if (this._connectionPromise) {
      this._connectionPromise.reject(error);
      this._connectionPromise = undefined;
    }

    // Schedule reconnection if appropriate
    if (this._abortController && !this._abortController.signal.aborted && resumptionToken) {
      this._scheduleReconnection(resumptionToken);
    }
  }

  /**
   * Calculate the next reconnection delay using exponential backoff
   */
  private _getNextReconnectionDelay(attempt: number): number {
    const initialDelay = this._reconnectionOptions.initialReconnectionDelay;
    const growFactor = this._reconnectionOptions.reconnectionDelayGrowFactor;
    const maxDelay = this._reconnectionOptions.maxReconnectionDelay;

    return Math.min(initialDelay * Math.pow(growFactor, attempt), maxDelay);
  }

  /**
   * Schedule a reconnection attempt with exponential backoff
   */
  private _scheduleReconnection(lastEventId: EventId): void {
    const maxRetries = this._reconnectionOptions.maxRetries;

    if (maxRetries > 0 && this._reconnectAttempt >= maxRetries) {
      this.onerror?.(new Error(`Maximum reconnection attempts (${maxRetries}) exceeded.`));
      return;
    }

    const delay = this._getNextReconnectionDelay(this._reconnectAttempt);

    setTimeout(() => {
      this._reconnectAttempt++;
      this._connectWithRetry(lastEventId).catch((error) => {
        this.onerror?.(
          new Error(
            `Failed to reconnect: ${error instanceof Error ? error.message : String(error)}`
          )
        );
      });
    }, delay);
  }

  /**
   * Send a message over the transport
   */
  async send(
    message: JSONRPCMessage,
    options?: {
      resumptionToken?: string;
      onresumptiontoken?: (token: string) => void;
    }
  ): Promise<void> {
    if (!this.isConnected || !this._port) {
      // Handle resumption case with explicit token
      if (options?.resumptionToken) {
        await this._connectWithRetry(options.resumptionToken).catch((err) => {
          this.onerror?.(
            new Error(
              `Failed to reconnect with token: ${err instanceof Error ? err.message : String(err)}`
            )
          );
          throw err;
        });
        if (!this.isConnected || !this._port) {
          throw new Error('Not connected after attempting reconnection with token.');
        }
      } else if (
        this._reconnectionOptions.maxRetries > 0 &&
        this.lastEventId &&
        this._abortController &&
        !this._abortController.signal.aborted
      ) {
        // Attempt auto-reconnection if disconnected, retries enabled, and lastEventId known
        await this._connectWithRetry(this.lastEventId).catch((err) => {
          const reconErr = new Error(
            `Failed to auto-reconnect: ${err instanceof Error ? err.message : String(err)}`
          );
          this.onerror?.(reconErr);
          throw reconErr;
        });
        if (!this.isConnected || !this._port) {
          throw new Error('Not connected after attempting auto-reconnection.');
        }
      } else {
        throw new Error('Not connected');
      }
    }

    // For browser transport, we just send the message directly
    // The event ID tracking is handled automatically by the server
    this._port.postMessage(message);
  }

  /**
   * Close the transport connection
   */
  async close(): Promise<void> {
    // Abort any pending operations
    this._abortController?.abort();
    this._abortController = undefined;

    if (this._connectionPromise) {
      this._connectionPromise.reject(new Error('Transport closed'));
      this._connectionPromise = undefined;
    }

    if (this._port) {
      this._port.close();
      this._port = undefined;
    }

    // Notify server of disconnection
    const windowWithMcp = window as MCPWindow;
    const mcp: MCPBrowserInterface | undefined =
      this._globalNamespace === 'mcp'
        ? windowWithMcp.mcp
        : (windowWithMcp as any)[this._globalNamespace];

    if (mcp?.disconnect) {
      mcp.disconnect(this.clientInstanceId);
    }

    this.isConnected = false;
    this.onclose?.();
  }

  /**
   * Terminate the current session explicitly
   * Similar to StreamableHTTP's terminateSession
   */
  async terminateSession(): Promise<void> {
    if (!this.sessionId) {
      return; // No session to terminate
    }

    try {
      // Use the new terminateSession for full cleanup if available
      const windowWithMcp = window as MCPWindow;
      const mcp: MCPBrowserInterface | undefined =
        this._globalNamespace === 'mcp'
          ? windowWithMcp.mcp
          : (windowWithMcp as any)[this._globalNamespace];

      if (mcp?.terminateSession) {
        mcp.terminateSession(this.clientInstanceId);
      } else if (mcp?.events?.clearEvents) {
        // Fallback to just clearing events if terminate is not implemented
        mcp.events.clearEvents(this.clientInstanceId);
      }

      this.sessionId = undefined;
      this.lastEventId = undefined;
    } catch (error) {
      this.onerror?.(error as Error);
      throw error;
    }
  }

  /**
   * Static helper to check if an MCP server is available
   * Similar to checking server availability before connection
   */
  static isServerAvailable(namespace: string = 'mcp'): boolean {
    const windowWithMcp = window as MCPWindow;
    const mcp: MCPBrowserInterface | undefined =
      namespace === 'mcp' ? windowWithMcp.mcp : (windowWithMcp as any)[namespace];

    return !!mcp?.isServerAvailable?.();
  }
}
