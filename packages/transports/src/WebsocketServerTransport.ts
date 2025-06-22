import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { JSONRPCMessage, JSONRPCMessageSchema } from '@modelcontextprotocol/sdk/types.js';

/**
 * Server transport for WebSocket: this will accept connections from MCP clients over WebSocket protocol.
 * Designed to work in browser extension environments.
 */
export class WebSocketServerTransport implements Transport {
  private _socket?: WebSocket;
  private _server?: any; // For environments that support WebSocketServer
  private _started = false;

  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;

  constructor(
    private _options: {
      /**
       * For browser extensions: provide an existing WebSocket connection
       */
      socket?: WebSocket;
      /**
       * For Node.js: provide port to create WebSocketServer
       */
      port?: number;
    }
  ) {}

  /**
   * Starts the transport. In browser extension context, this validates the socket.
   */
  async start(): Promise<void> {
    if (this._started) {
      throw new Error(
        'WebSocketServerTransport already started! If using Server class, note that connect() calls start() automatically.'
      );
    }
    this._started = true;

    if (this._options.socket) {
      this._socket = this._options.socket;
      this.setupSocketHandlers(this._socket);
    } else {
      throw new Error('WebSocketServerTransport requires either a socket ');
    }
  }

  private setupSocketHandlers(socket: WebSocket): void {
    socket.onmessage = (event: MessageEvent) => {
      let message: JSONRPCMessage;
      try {
        const data = typeof event.data === 'string' ? event.data : event.data.toString();
        message = JSONRPCMessageSchema.parse(JSON.parse(data));
      } catch (error) {
        this.onerror?.(error as Error);
        return;
      }
      this.onmessage?.(message);
    };

    socket.onerror = (event: Event) => {
      const error = new Error(`WebSocket error: ${JSON.stringify(event)}`);
      this.onerror?.(error);
    };

    socket.onclose = () => {
      this._socket = undefined;
      this.onclose?.();
    };
  }

  async close(): Promise<void> {
    if (this._socket) {
      this._socket.close();
      this._socket = undefined;
    }

    if (this._server) {
      return new Promise((resolve) => {
        this._server.close(() => {
          this._server = undefined;
          resolve();
        });
      });
    }
  }

  send(message: JSONRPCMessage): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this._socket || this._socket.readyState !== WebSocket.OPEN) {
        reject(new Error('No active WebSocket connection'));
        return;
      }

      try {
        this._socket.send(JSON.stringify(message));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get the current WebSocket connection (if any)
   */
  get socket(): WebSocket | undefined {
    return this._socket;
  }

  /**
   * Check if transport has an active connection
   */
  get isConnected(): boolean {
    return this._socket?.readyState === WebSocket.OPEN;
  }
}
