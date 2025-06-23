import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { JSONRPCMessage, JSONRPCMessageSchema } from '@modelcontextprotocol/sdk/types.js';

export interface BrowserWebSocketClientTransportOptions {
  maxRetries?: number;
  initialRetryDelay?: number;
  maxRetryDelay?: number;
  connectionTimeout?: number;
  retryMultiplier?: number;
}

/**
 * Browser-compatible WebSocket client transport for connecting from browser extensions to a bridge server.
 * This transport uses the native browser WebSocket API and doesn't require any Node.js dependencies.
 */
export class BrowserWebSocketClientTransport implements Transport {
  private _socket?: WebSocket;
  private _url: string;
  private _connectionId?: string;
  private _options: Required<BrowserWebSocketClientTransportOptions>;
  private _retryCount = 0;
  private _isClosing = false;
  private _connectionTimeoutId?: number;

  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;

  constructor(url: string | URL, options?: BrowserWebSocketClientTransportOptions) {
    this._url = url.toString();
    this._options = {
      maxRetries: options?.maxRetries ?? 10,
      initialRetryDelay: options?.initialRetryDelay ?? 1000,
      maxRetryDelay: options?.maxRetryDelay ?? 30000,
      connectionTimeout: options?.connectionTimeout ?? 10000,
      retryMultiplier: options?.retryMultiplier ?? 1.5,
    };
  }

  async start(): Promise<void> {
    if (this._socket) {
      throw new Error(
        'BrowserWebSocketClientTransport already started! If using Client class, note that connect() calls start() automatically.'
      );
    }

    this._isClosing = false;
    this._retryCount = 0;
    return this._connectWithRetry();
  }

  private async _connectWithRetry(): Promise<void> {
    while (this._retryCount <= this._options.maxRetries && !this._isClosing) {
      try {
        await this._attemptConnection();
        return; // Success!
      } catch (error) {
        this._retryCount++;

        if (this._isClosing) {
          throw new Error('Connection cancelled');
        }

        if (this._retryCount > this._options.maxRetries) {
          throw new Error(`Failed to connect after ${this._options.maxRetries} retries: ${error}`);
        }

        const delay = Math.min(
          this._options.initialRetryDelay *
            Math.pow(this._options.retryMultiplier, this._retryCount - 1),
          this._options.maxRetryDelay
        );

        console.log(
          `[WebSocket] Connection failed, retrying in ${delay}ms (attempt ${this._retryCount}/${this._options.maxRetries})`
        );
        await this._sleep(delay);
      }
    }
  }

  private _sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async _attemptConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Clear any existing timeout
        if (this._connectionTimeoutId) {
          clearTimeout(this._connectionTimeoutId);
        }

        // Create WebSocket with browser API
        this._socket = new WebSocket(this._url);

        // Set connection timeout
        this._connectionTimeoutId = setTimeout(() => {
          if (this._socket && this._socket.readyState === WebSocket.CONNECTING) {
            this._socket.close();
            reject(new Error(`Connection timeout after ${this._options.connectionTimeout}ms`));
          }
        }, this._options.connectionTimeout) as unknown as number;

        this._socket.onopen = () => {
          // Clear timeout on successful connection
          if (this._connectionTimeoutId) {
            clearTimeout(this._connectionTimeoutId);
            this._connectionTimeoutId = undefined;
          }
          this._retryCount = 0; // Reset retry count on successful connection
          resolve();
        };

        this._socket.onerror = (_event) => {
          const error = new Error(`WebSocket connection error`);
          reject(error);
          // Don't call this.onerror during connection attempts
        };

        this._socket.onclose = () => {
          this._socket = undefined;
          this._connectionId = undefined;

          // Only call onclose if we're not in the middle of retrying
          if (!this._isClosing && this._retryCount === 0) {
            this.onclose?.();
          }
        };

        this._socket.onmessage = (event: MessageEvent) => {
          let data: any;
          try {
            data = JSON.parse(event.data);

            // Handle bridge-specific messages
            if (data.connectionId && !this._connectionId) {
              // Store connectionId for future messages
              this._connectionId = data.connectionId;
            }

            // Extract the actual message
            if (data.connectionId) {
              const { connectionId, ...message } = data;
              data = message;
            }

            const message = JSONRPCMessageSchema.parse(data);
            this.onmessage?.(message);
          } catch (error) {
            this.onerror?.(error as Error);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  async close(): Promise<void> {
    this._isClosing = true;

    // Clear any pending connection timeout
    if (this._connectionTimeoutId) {
      clearTimeout(this._connectionTimeoutId);
      this._connectionTimeoutId = undefined;
    }

    if (this._socket && this._socket.readyState === WebSocket.OPEN) {
      this._socket.close();
    }
  }

  async send(message: JSONRPCMessage): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this._socket || this._socket.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket is not connected'));
        return;
      }

      try {
        // If we have a connectionId from the bridge, include it
        const messageToSend = this._connectionId
          ? { ...message, connectionId: this._connectionId }
          : message;

        this._socket.send(JSON.stringify(messageToSend));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Check if transport is connected
   */
  get isConnected(): boolean {
    return this._socket?.readyState === WebSocket.OPEN;
  }
}
