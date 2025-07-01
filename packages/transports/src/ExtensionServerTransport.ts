import type {
  Transport,
  TransportSendOptions,
} from '@modelcontextprotocol/sdk/shared/transport.js';
import { type JSONRPCMessage, JSONRPCMessageSchema } from '@modelcontextprotocol/sdk/types.js';

/**
 * Server transport for Chrome extensions using Port-based messaging.
 * This transport handles a single client connection through Chrome's port messaging API.
 * It should be used in the extension's background service worker.
 */
export class ExtensionServerTransport implements Transport {
  private _port: chrome.runtime.Port;
  private _started = false;
  private _messageHandler?: (message: any, port: chrome.runtime.Port) => void;
  private _disconnectHandler?: (port: chrome.runtime.Port) => void;

  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;

  constructor(port: chrome.runtime.Port) {
    this._port = port;
  }

  /**
   * Starts the transport and begins handling messages
   */
  async start(): Promise<void> {
    if (this._started) {
      throw new Error(
        'ExtensionServerTransport already started! If using Server class, note that connect() calls start() automatically.'
      );
    }

    if (!this._port) {
      throw new Error('Port not available');
    }

    this._started = true;

    // Set up message handler
    this._messageHandler = (message: any) => {
      try {
        const mcpMessage = JSONRPCMessageSchema.parse(message);
        this.onmessage?.(mcpMessage);
      } catch (error) {
        this.onerror?.(new Error(`Failed to parse message: ${error}`));
      }
    };

    // Set up disconnect handler
    this._disconnectHandler = () => {
      this._cleanup();
      this.onclose?.();
    };

    this._port.onMessage.addListener(this._messageHandler);
    this._port.onDisconnect.addListener(this._disconnectHandler);
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
    if (this._port) {
      if (this._messageHandler) {
        this._port.onMessage.removeListener(this._messageHandler);
      }
      if (this._disconnectHandler) {
        this._port.onDisconnect.removeListener(this._disconnectHandler);
      }
    }
  }
}
