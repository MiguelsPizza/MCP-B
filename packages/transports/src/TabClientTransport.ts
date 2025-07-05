import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { type JSONRPCMessage, JSONRPCMessageSchema } from '@modelcontextprotocol/sdk/types.js';

// Type declaration for Promise.withResolvers() if not available in current TypeScript version
// declare global {
//   interface PromiseConstructor {
//     withResolvers<T>(): {
//       promise: Promise<T>;
//       resolve: (value: T | PromiseLike<T>) => void;
//       reject: (reason?: any) => void;
//     };
//   }
// }

export interface TabClientTransportOptions {
  targetOrigin: string; // Required for security
  channelId?: string; // Optional channel name
}

export class TabClientTransport implements Transport {
  private _started = false;
  private _targetOrigin: string;
  private _channelId: string;
  private _messageHandler?: (event: MessageEvent) => void;
  public readonly serverReadyPromise: Promise<void>;
  private _serverReadyResolve: () => void;
  private _serverReadyReject: (reason: any) => void;

  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;

  constructor(options: TabClientTransportOptions) {
    if (!options.targetOrigin) {
      throw new Error('targetOrigin must be explicitly set for security');
    }
    this._targetOrigin = options.targetOrigin;
    this._channelId = options.channelId || 'mcp-default';

    // Create the server ready promise in constructor so it's available immediately
    const { promise, resolve, reject } = Promise.withResolvers<void>();
    this.serverReadyPromise = promise;
    this._serverReadyResolve = resolve;
    this._serverReadyReject = reject;
  }

  async start(): Promise<void> {
    if (this._started) {
      throw new Error('Transport already started');
    }

    this._messageHandler = (event: MessageEvent) => {
      // Security: validate origin
      if (event.origin !== this._targetOrigin) {
        return;
      }

      // Validate message structure
      if (event.data?.channel !== this._channelId || event.data?.type !== 'mcp') {
        return;
      }

      // Only process server-to-client messages to avoid processing own messages
      if (event.data?.direction !== 'server-to-client') {
        return;
      }

      // Handle server ready signal
      if (event.data.payload === 'mcp-server-ready') {
        this._serverReadyResolve();
        return;
      }

      try {
        const message = JSONRPCMessageSchema.parse(event.data.payload);
        this.onmessage?.(message);
      } catch (error) {
        this.onerror?.(new Error(`Invalid message: ${error}`));
      }
    };

    window.addEventListener('message', this._messageHandler);
    this._started = true;
  }

  async send(message: JSONRPCMessage): Promise<void> {
    if (!this._started) {
      throw new Error('Transport not started');
    }

    window.postMessage(
      {
        channel: this._channelId,
        type: 'mcp',
        direction: 'client-to-server', // Mark as client-to-server message
        payload: message,
      },
      this._targetOrigin
    );
  }

  async close(): Promise<void> {
    if (this._messageHandler) {
      window.removeEventListener('message', this._messageHandler);
    }

    // Reject the server ready promise if it hasn't been resolved yet
    this._serverReadyReject(new Error('Transport closed before server ready'));

    this._started = false;
    this.onclose?.();
  }
}
