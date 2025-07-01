import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { type JSONRPCMessage, JSONRPCMessageSchema } from '@modelcontextprotocol/sdk/types.js';

const SUBPROTOCOL = 'mcp';

/**
 * Client transport for WebSocket: this will connect to a server over the WebSocket protocol.
 * This transport is Node.js specific and requires the 'ws' package to be installed.
 */
export class WebSocketClientTransport implements Transport {
  private _socket?: any; // WebSocket type from 'ws' package
  private _url: URL;
  private _WebSocket?: typeof import('ws').WebSocket;

  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;

  constructor(url: URL) {
    this._url = url;
  }

  async start(): Promise<void> {
    if (this._socket) {
      throw new Error(
        'WebSocketClientTransport already started! If using Client class, note that connect() calls start() automatically.'
      );
    }

    // Dynamically import the WebSocket class from 'ws' package
    if (!this._WebSocket) {
      try {
        const ws = await import('ws');
        this._WebSocket = ws.WebSocket;
      } catch (error) {
        throw new Error("Failed to import 'ws' package. Please install it with: npm install ws");
      }
    }

    return new Promise((resolve, reject) => {
      // Create WebSocket instance with Node.js specific options
      this._socket = new this._WebSocket!(this._url.toString(), {
        perMessageDeflate: false,
        // Add the subprotocol in the options
        ...(SUBPROTOCOL ? { protocol: SUBPROTOCOL } : {}),
      });

      // Node.js WebSocket error event handler
      this._socket.on('error', (error: Error) => {
        reject(error);
        this.onerror?.(error);
      });

      // Node.js WebSocket open event handler
      this._socket.on('open', () => {
        resolve();
      });

      // Node.js WebSocket close event handler
      this._socket.on('close', () => {
        this.onclose?.();
      });

      // Node.js WebSocket message event handler
      this._socket.on('message', (data: Buffer | ArrayBuffer | Buffer[]) => {
        let message: JSONRPCMessage;
        try {
          // Convert Buffer to string before parsing
          const dataStr = data instanceof Buffer ? data.toString('utf-8') : data.toString();
          message = JSONRPCMessageSchema.parse(JSON.parse(dataStr));
        } catch (error) {
          this.onerror?.(error as Error);
          return;
        }
        this.onmessage?.(message);
      });
    });
  }

  async close(): Promise<void> {
    if (this._socket && this._WebSocket) {
      // Check the readyState before closing
      if (this._socket.readyState === this._WebSocket.OPEN) {
        this._socket.close();
      }
    }
  }

  async send(message: JSONRPCMessage): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this._socket || !this._WebSocket) {
        reject(new Error('Not connected'));
        return;
      }

      // Check if the socket is open before sending
      if (this._socket.readyState !== this._WebSocket.OPEN) {
        reject(new Error('WebSocket is not open'));
        return;
      }

      // In Node.js, send accepts a callback for error handling
      this._socket.send(JSON.stringify(message), (error?: Error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}
