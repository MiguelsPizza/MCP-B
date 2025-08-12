import type {
  Transport,
  TransportSendOptions,
} from '@modelcontextprotocol/sdk/shared/transport.js';
import { type JSONRPCMessage, JSONRPCMessageSchema } from '@modelcontextprotocol/sdk/types.js';

/**
 * Configuration options for ExtensionClientTransport
 */
export interface ExtensionClientTransportOptions {
  /**
   * The extension ID to connect to (optional for same-extension connections)
   */
  extensionId?: string;

  /**
   * Port name for the connection
   * Default: 'mcp'
   */
  portName?: string;

  /**
   * Enable automatic reconnection on disconnect
   * Default: true
   */
  autoReconnect?: boolean;

  /**
   * Maximum number of reconnection attempts
   * Default: 10
   */
  maxReconnectAttempts?: number;

  /**
   * Initial reconnection delay in milliseconds
   * Default: 1000
   */
  reconnectDelay?: number;

  /**
   * Maximum reconnection delay in milliseconds
   * Default: 30000
   */
  maxReconnectDelay?: number;

  /**
   * Reconnection backoff multiplier
   * Default: 1.5
   */
  reconnectBackoffMultiplier?: number;
}

/**
 * Client transport for Chrome extensions using Port-based messaging.
 * This transport can be used in content scripts, popup scripts, or sidepanel scripts
 * to connect to a server running in the background service worker.
 *
 * Features automatic reconnection to handle background service worker lifecycle.
 */
export class ExtensionClientTransport implements Transport {
  private _port?: chrome.runtime.Port;
  private _extensionId?: string;
  private _portName: string;
  private _messageHandler?: (message: any) => void;
  private _disconnectHandler?: () => void;
  private _isReconnecting = false;
  private _reconnectAttempts = 0;
  private _reconnectTimer?: number;
  private _currentReconnectDelay: number;
  private _isStarted = false;
  private _isClosed = false;

  // Configuration
  private _autoReconnect: boolean;
  private _maxReconnectAttempts: number;
  private _reconnectDelay: number;
  private _maxReconnectDelay: number;
  private _reconnectBackoffMultiplier: number;

  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;

  constructor(options: ExtensionClientTransportOptions = {}) {
    this._extensionId = options.extensionId;
    this._portName = options.portName || 'mcp';
    this._autoReconnect = options.autoReconnect ?? true;
    this._maxReconnectAttempts = options.maxReconnectAttempts ?? 10;
    this._reconnectDelay = options.reconnectDelay ?? 1000;
    this._maxReconnectDelay = options.maxReconnectDelay ?? 30000;
    this._reconnectBackoffMultiplier = options.reconnectBackoffMultiplier ?? 1.5;
    this._currentReconnectDelay = this._reconnectDelay;
  }

  /**
   * Starts the transport by connecting to the extension port
   */
  async start(): Promise<void> {
    if (this._isStarted && this._port) {
      console.warn(
        'ExtensionClientTransport already started! If using Client class, note that connect() calls start() automatically.'
      );
      return;
    }

    this._isStarted = true;
    this._isClosed = false;

    await this._connect();
  }

  /**
   * Connects to the extension port
   */
  private async _connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!chrome?.runtime?.connect) {
        reject(
          new Error(
            'Chrome runtime API not available. This transport must be used in a Chrome extension context.'
          )
        );
        return;
      }

      try {
        // Connect to the extension
        if (this._extensionId) {
          this._port = chrome.runtime.connect(this._extensionId, { name: this._portName });
        } else {
          this._port = chrome.runtime.connect({ name: this._portName });
        }

        // Set up message handler
        this._messageHandler = (message: any) => {
          try {
            // Handle keep-alive messages
            if (message.type === 'keep-alive') {
              // Just acknowledge receipt, no need to propagate
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
          this._cleanup();

          // Only attempt reconnection if we're started and not manually closed
          if (this._isStarted && !this._isClosed && this._autoReconnect) {
            this._scheduleReconnect();
          } else {
            this.onclose?.();
          }
        };

        this._port.onMessage.addListener(this._messageHandler);
        this._port.onDisconnect.addListener(this._disconnectHandler);

        // Check for immediate connection errors
        const error = chrome.runtime.lastError;
        if (error) {
          this._cleanup();

          // If we're reconnecting and hit an error, schedule another attempt
          if (this._isReconnecting && this._isStarted && !this._isClosed && this._autoReconnect) {
            reject(new Error(`Connection failed: ${error.message}`));
            return;
          }

          reject(new Error(`Connection failed: ${error.message}`));
          return;
        }

        // Connection successful
        this._reconnectAttempts = 0;
        this._currentReconnectDelay = this._reconnectDelay;
        this._isReconnecting = false;

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Sends a message to the server
   */
  async send(message: JSONRPCMessage, _options?: TransportSendOptions): Promise<void> {
    if (!this._isStarted) {
      throw new Error('Transport not started');
    }

    if (this._isClosed) {
      throw new Error('Transport is closed');
    }

    if (!this._port) {
      throw new Error('Not connected');
    }

    try {
      this._port.postMessage(message);
    } catch (error) {
      throw new Error(`Failed to send message: ${error}`);
    }
  }

  /**
   * Closes the transport
   */
  async close(): Promise<void> {
    this._isClosed = true;
    this._isStarted = false;

    // Cancel any pending reconnection
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = undefined;
    }

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
    if (this._port) {
      if (this._messageHandler) {
        this._port.onMessage.removeListener(this._messageHandler);
      }
      if (this._disconnectHandler) {
        this._port.onDisconnect.removeListener(this._disconnectHandler);
      }
    }
    this._port = undefined;
  }

  /**
   * Schedules a reconnection attempt
   */
  private _scheduleReconnect(): void {
    if (this._isReconnecting || this._isClosed || !this._isStarted) {
      return;
    }

    this._isReconnecting = true;

    // Check if we've exceeded max attempts
    if (this._reconnectAttempts >= this._maxReconnectAttempts) {
      console.error('Maximum reconnection attempts reached');
      this._isReconnecting = false;
      this.onerror?.(new Error('Maximum reconnection attempts reached'));
      this.onclose?.();
      return;
    }

    this._reconnectAttempts++;

    console.log(
      `Scheduling reconnection attempt ${this._reconnectAttempts}/${this._maxReconnectAttempts} in ${this._currentReconnectDelay}ms`
    );

    this._reconnectTimer = setTimeout(() => {
      this._attemptReconnect();
    }, this._currentReconnectDelay) as unknown as number;

    // Apply exponential backoff
    this._currentReconnectDelay = Math.min(
      this._currentReconnectDelay * this._reconnectBackoffMultiplier,
      this._maxReconnectDelay
    );
  }

  /**
   * Attempts to reconnect to the extension
   */
  private async _attemptReconnect(): Promise<void> {
    if (this._isClosed || !this._isStarted) {
      return;
    }

    try {
      // First, try to wake up the service worker by sending a message
      if (chrome?.runtime?.sendMessage) {
        try {
          await chrome.runtime.sendMessage({ type: 'ping' });
        } catch (error) {
          // Service worker might not be ready yet
        }
      }

      // Attempt to connect
      await this._connect();

      console.log('Reconnection successful');
      this._isReconnecting = false;
    } catch (error) {
      console.error('Reconnection failed:', error);

      // Schedule another attempt
      this._scheduleReconnect();
    }
  }
}
