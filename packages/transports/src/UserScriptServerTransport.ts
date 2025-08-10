import type {
  Transport,
  TransportSendOptions,
} from '@modelcontextprotocol/sdk/shared/transport.js';
import { type JSONRPCMessage, JSONRPCMessageSchema } from '@modelcontextprotocol/sdk/types.js';

/**
 * Configuration options for UserScriptServerTransport
 */
export type UserScriptServerTransportOptions = {
  /**
   * Enable keep-alive mechanism to prevent service worker shutdown
   * Default: true
   */
  keepAlive?: boolean;

  /**
   * Keep-alive interval in milliseconds
   * Default: 25000 (25 seconds, less than Chrome's 30-second timeout)
   */
  keepAliveInterval?: number;
};

/**
 * Server transport for Chrome MV3 User Scripts using Port-based messaging.
 * This transport handles a single client connection through Chrome's port
 * messaging API. It should be used in the extension's background service
 * worker. Connections are initiated from User Scripts via chrome.runtime.connect
 * and received here via chrome.runtime.onUserScriptConnect.
 *
 * Features:
 * - Keep-alive mechanism to prevent service worker shutdown
 * - Graceful connection state management
 */
export class UserScriptServerTransport implements Transport {
  private _port: chrome.runtime.Port;
  private _started = false;
  private _messageHandler?: (message: any, port: chrome.runtime.Port) => void;
  private _disconnectHandler?: (port: chrome.runtime.Port) => void;
  private _keepAliveTimer?: number;
  private _options: UserScriptServerTransportOptions;
  private _connectionInfo: {
    connectedAt: number;
    lastMessageAt: number;
    messageCount: number;
  };

  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;

  constructor(port: chrome.runtime.Port, options: UserScriptServerTransportOptions = {}) {
    this._port = port;
    this._options = {
      keepAlive: options.keepAlive ?? true,
      keepAliveInterval: options.keepAliveInterval ?? 1000,
    };
    this._connectionInfo = {
      connectedAt: Date.now(),
      lastMessageAt: Date.now(),
      messageCount: 0,
    };
  }

  /**
   * Starts the transport and begins handling messages
   */
  async start(): Promise<void> {
    if (this._started) {
      throw new Error(
        'UserScriptServerTransport already started! If using Server class, note that connect() calls start() automatically.'
      );
    }

    if (!this._port) {
      throw new Error('Port not available');
    }

    this._started = true;

    // Set up message handler
    this._messageHandler = (message: any) => {
      try {
        // Update connection info
        this._connectionInfo.lastMessageAt = Date.now();
        this._connectionInfo.messageCount++;

        // Handle ping messages for keep-alive
        if ((message as any).type === 'ping') {
          this._port.postMessage({ type: 'pong' });
          return;
        }

        const mcpMessage = JSONRPCMessageSchema.parse(message);
        this.onmessage?.(mcpMessage);
      } catch (error) {
        this.onerror?.(new Error(`Failed to parse message: ${error}`));
      }
    };

    // Set up disconnect handler
    this._disconnectHandler = () => {
      console.log(
        `[UserScriptServerTransport] Client disconnected after ${Date.now() - this._connectionInfo.connectedAt}ms, processed ${this._connectionInfo.messageCount} messages`
      );
      this._cleanup();
      this.onclose?.();
    };

    this._port.onMessage.addListener(this._messageHandler);
    this._port.onDisconnect.addListener(this._disconnectHandler);

    // Start keep-alive mechanism if enabled
    if (this._options.keepAlive) {
      this._startKeepAlive();
    }

    console.log(
      `[UserScriptServerTransport] Started with client: ${this._port.sender?.id || 'unknown'}`
    );
  }

  /**
   * Sends a message to the client
   */
  async send(message: JSONRPCMessage, _options?: TransportSendOptions): Promise<void> {
    if (!this._started) {
      throw new Error('Transport not started');
    }

    if (!this._port) {
      throw new Error('Not connected to client');
    }

    try {
      this._port.postMessage(message);
    } catch (error) {
      // Check if the error is due to disconnection
      if (chrome.runtime.lastError || !this._port) {
        this._cleanup();
        this.onclose?.();
        throw new Error('Client disconnected');
      }
      throw new Error(`Failed to send message: ${error}`);
    }
  }

  /**
   * Closes the transport
   */
  async close(): Promise<void> {
    this._started = false;

    if (this._port) {
      try {
        this._port.disconnect();
      } catch (error) {
        // Port might already be disconnected
      }
    }

    this._cleanup();
    this.onclose?.();
  }

  /**
   * Cleans up event listeners and references
   */
  private _cleanup(): void {
    // Stop keep-alive timer
    if (this._keepAliveTimer) {
      clearInterval(this._keepAliveTimer);
      this._keepAliveTimer = undefined;
    }

    if (this._port) {
      if (this._messageHandler) {
        this._port.onMessage.removeListener(this._messageHandler);
      }
      if (this._disconnectHandler) {
        this._port.onDisconnect.removeListener(this._disconnectHandler);
      }
    }
  }

  /**
   * Starts the keep-alive mechanism
   */
  private _startKeepAlive(): void {
    if (this._keepAliveTimer) {
      return;
    }

    console.log(
      `[UserScriptServerTransport] Starting keep-alive with ${this._options.keepAliveInterval}ms interval`
    );

    this._keepAliveTimer = setInterval(() => {
      if (!this._port) {
        this._stopKeepAlive();
        return;
      }

      try {
        // Send a keep-alive ping
        this._port.postMessage({ type: 'keep-alive', timestamp: Date.now() });
      } catch (error) {
        console.error('[UserScriptServerTransport] Keep-alive failed:', error);
        this._stopKeepAlive();
      }
    }, this._options.keepAliveInterval!) as unknown as number;
  }

  /**
   * Stops the keep-alive mechanism
   */
  private _stopKeepAlive(): void {
    if (this._keepAliveTimer) {
      clearInterval(this._keepAliveTimer);
      this._keepAliveTimer = undefined;
    }
  }

  /**
   * Gets connection information
   */
  getConnectionInfo() {
    return {
      ...this._connectionInfo,
      uptime: Date.now() - this._connectionInfo.connectedAt,
      isConnected: !!this._port && this._started,
    };
  }
}


