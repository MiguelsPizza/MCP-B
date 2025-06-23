import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { JSONRPCMessage, JSONRPCMessageSchema } from '@modelcontextprotocol/sdk/types.js';

/**
 * Browser-compatible WebSocket client transport for connecting from browser extensions to a bridge server.
 * This transport uses the native browser WebSocket API and doesn't require any Node.js dependencies.
 */
export class BrowserWebSocketClientTransport implements Transport {
  private _socket?: WebSocket;
  private _url: string;
  private _connectionId?: string;

  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;

  constructor(url: string | URL) {
    this._url = url.toString();
  }

  async start(): Promise<void> {
    if (this._socket) {
      throw new Error(
        'BrowserWebSocketClientTransport already started! If using Client class, note that connect() calls start() automatically.'
      );
    }

    return new Promise((resolve, reject) => {
      try {
        // Create WebSocket with browser API
        this._socket = new WebSocket(this._url);

        this._socket.onopen = () => {
          resolve();
        };

        this._socket.onerror = (_event) => {
          const error = new Error(`WebSocket connection error`);
          reject(error);
          this.onerror?.(error);
        };

        this._socket.onclose = () => {
          this._socket = undefined;
          this._connectionId = undefined;
          this.onclose?.();
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
