// TabClientTransport.ts

import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { type JSONRPCMessage, JSONRPCMessageSchema } from '@modelcontextprotocol/sdk/types.js';

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
  // private _retryInterval?: NodeJS.Timeout;

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
    this._serverReadyResolve = () => {
      resolve();
    };
    this._serverReadyReject = (reason) => {
      reject(reason);
    };
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

      const payload = event.data.payload;

      // Handle server ready signal
      if (typeof payload === 'string' && payload === 'mcp-server-ready') {
        this._serverReadyResolve();
        return;
      }

      // Handle server stopped signal
      if (typeof payload === 'string' && payload === 'mcp-server-stopped') {
        console.log('[TabClientTransport] Received mcp-server-stopped event, closing transport');
        this.close();
        return;
      }

      try {
        const message = JSONRPCMessageSchema.parse(payload);
        this._serverReadyResolve();
        this.onmessage?.(message);
      } catch (error) {
        this.onerror?.(
          new Error(`Invalid message: ${error instanceof Error ? error.message : String(error)}`)
        );
      }
    };

    window.addEventListener('message', this._messageHandler);
    this._started = true;

    // Send check-ready to prompt server if already started
    this.sendCheckReady();
  }

  private sendCheckReady() {
    window.postMessage(
      {
        channel: this._channelId,
        type: 'mcp',
        direction: 'client-to-server',
        payload: 'mcp-check-ready',
      },
      this._targetOrigin
    );
  }

  async send(message: JSONRPCMessage): Promise<void> {
    if (!this._started) {
      throw new Error('Transport not started');
    }

    // Await server ready before sending any JSON-RPC message
    await this.serverReadyPromise;

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
