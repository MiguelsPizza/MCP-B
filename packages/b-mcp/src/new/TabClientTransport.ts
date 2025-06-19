import { Transport, TransportSendOptions } from '@modelcontextprotocol/sdk/shared/transport.js';
import {
  Implementation,
  isJSONRPCError,
  isJSONRPCNotification,
  isJSONRPCResponse,
  JSONRPCMessage,
  JSONRPCMessageSchema,
  ServerCapabilities,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

/**
 * Message types for browser transport communication
 */
interface BrowserTransportMessage {
  type: 'MCP_REQUEST' | 'MCP_RESPONSE' | 'MCP_NOTIFICATION';
  connectionId: string;
  serverId: string;
  data: JSONRPCMessage;
}

interface DiscoveryMessage {
  type: 'MCP_DISCOVERY_REQUEST' | 'MCP_DISCOVERY_RESPONSE';
  connectionId?: string;
  serverId?: string;
  serverInfo?: {
    implementation: Implementation;
    capabilities: ServerCapabilities;
    protocolVersion: string;
  };
}

/**
 * Browser transport message schema for validation
 */
const BrowserTransportMessageSchema = z.object({
  type: z.enum(['MCP_REQUEST', 'MCP_RESPONSE', 'MCP_NOTIFICATION']),
  connectionId: z.string(),
  serverId: z.string(),
  data: z.any(),
});

/**
 * Discovery message schema for validation
 */
const DiscoveryMessageSchema = z.object({
  type: z.enum(['MCP_DISCOVERY_REQUEST', 'MCP_DISCOVERY_RESPONSE']),
  connectionId: z.string().optional(),
  serverId: z.string().optional(),
  serverInfo: z
    .object({
      implementation: z
        .object({
          name: z.string(),
          version: z.string(),
        })
        .passthrough(),
      capabilities: z.object({}).passthrough(),
      protocolVersion: z.string(),
    })
    .optional(),
});

/**
 * Configuration options for TabClientTransport
 */
export interface TabClientTransportOptions {
  /**
   * Target window to connect to (defaults to window)
   */
  targetWindow?: Window;

  /**
   * Target origin for postMessage (defaults to '*' for any origin)
   * For security, this should be set to the specific origin when known
   */
  targetOrigin?: string;

  /**
   * Timeout for discovery operations (in milliseconds)
   */
  timeout?: number;

  /**
   * Optional connection ID (will be auto-generated if not provided)
   * This helps differentiate between multiple clients
   */
  connectionId?: string;
}

/**
 * Server information returned from discovery
 */
export interface BrowserServerInfo {
  serverId: string;
  implementation: Implementation;
  capabilities: ServerCapabilities;
  protocolVersion: string;
}

/**
 * Client transport for browser contexts using postMessage.
 * This transport allows browser contexts (like content scripts) to discover
 * and connect to MCP servers exposed by web pages.
 */
export class TabClientTransport implements Transport {
  private _started = false;
  private _targetWindow: Window;
  private _targetOrigin: string;
  private _timeout: number;
  private _connectionId: string;
  private _serverId?: string;
  private _serverInfo?: BrowserServerInfo;
  private _messageHandler?: (event: MessageEvent) => void;

  sessionId?: string; // Not used in browser transport
  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;
  setProtocolVersion?: (version: string) => void;

  constructor(options: TabClientTransportOptions = {}) {
    this._targetWindow = options.targetWindow || window;
    this._targetOrigin = options.targetOrigin || '*';
    this._timeout = options.timeout || 1;
    this._connectionId = options.connectionId || this._generateId();
  }

  /**
   * Generates a unique ID
   */
  private _generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Discovers available MCP servers in the target window
   */
  async discover(): Promise<BrowserServerInfo[]> {
    return new Promise((resolve) => {
      const servers: BrowserServerInfo[] = [];

      // Set up temporary listener for discovery responses
      const discoveryHandler = (event: MessageEvent) => {
        if (!event.data || typeof event.data !== 'object') {
          return;
        }

        try {
          const message = DiscoveryMessageSchema.parse(event.data);
          if (
            message.type === 'MCP_DISCOVERY_RESPONSE' &&
            message.connectionId === this._connectionId &&
            message.serverInfo &&
            message.serverId
          ) {
            // Construct server info
            const serverInfo: BrowserServerInfo = {
              serverId: message.serverId,
              implementation: message.serverInfo.implementation,
              capabilities: message.serverInfo.capabilities,
              protocolVersion: message.serverInfo.protocolVersion,
            };

            // Add server to list if not already present
            if (!servers.find((s) => s.serverId === serverInfo.serverId)) {
              servers.push(serverInfo);
            }
          }
        } catch (error) {
          // Invalid discovery response, ignore
        }
      };

      window.addEventListener('message', discoveryHandler);

      // Send discovery request
      const discoveryRequest: DiscoveryMessage = {
        type: 'MCP_DISCOVERY_REQUEST',
        connectionId: this._connectionId,
      };

      this._targetWindow.postMessage(discoveryRequest, this._targetOrigin);

      // Wait for responses, then resolve
      setTimeout(() => {
        window.removeEventListener('message', discoveryHandler);
        resolve(servers);
      }, this._timeout);
    });
  }

  /**
   * Connects to a specific server
   */
  async connectToServer(serverId: string): Promise<void> {
    this._serverId = serverId;

    // Find server info if we don't have it
    if (!this._serverInfo || this._serverInfo.serverId !== serverId) {
      const servers = await this.discover();
      const server = servers.find((s) => s.serverId === serverId);
      if (!server) {
        throw new Error(`Server with ID ${serverId} not found`);
      }
      this._serverInfo = server;

      // Set protocol version if handler is available
      if (this.setProtocolVersion && server.protocolVersion) {
        this.setProtocolVersion(server.protocolVersion);
      }
    }
  }

  /**
   * Starts the transport
   */
  async start(): Promise<void> {
    if (this._started) {
      throw new Error('Transport already started');
    }

    // If no server selected, discover and connect to first available
    if (!this._serverId) {
      const servers = await this.discover();
      if (servers.length === 0) {
        throw new Error('No MCP servers found');
      }
      await this.connectToServer(servers[0].serverId);
    }

    // Set up message handler
    this._messageHandler = (event: MessageEvent) => {
      this._handleMessage(event);
    };

    window.addEventListener('message', this._messageHandler);
    this._started = true;
  }

  /**
   * Handles incoming messages
   */
  private _handleMessage(event: MessageEvent): void {
    if (!event.data || typeof event.data !== 'object') {
      return;
    }

    try {
      const message = BrowserTransportMessageSchema.parse(event.data);

      // Only process messages intended for this connection from the connected server
      if (
        (message.type === 'MCP_RESPONSE' ||
          message.type === 'MCP_NOTIFICATION' ||
          message.type === 'MCP_REQUEST') &&
        message.serverId === this._serverId &&
        (message.connectionId === this._connectionId || message.connectionId === '')
      ) {
        try {
          const mcpMessage = JSONRPCMessageSchema.parse(message.data);
          this.onmessage?.(mcpMessage);
        } catch (error) {
          this.onerror?.(new Error(`Failed to parse MCP message: ${error}`));
        }
      }
    } catch (error) {
      // Not a valid browser transport message, ignore
    }
  }

  /**
   * Sends a message to the server
   */
  async send(message: JSONRPCMessage, _options?: TransportSendOptions): Promise<void> {
    if (!this._started) {
      throw new Error('Transport not started');
    }

    if (!this._serverId) {
      throw new Error('No server connected');
    }

    // Determine message type based on JSONRPCMessage type
    let messageType: 'MCP_REQUEST' | 'MCP_RESPONSE' | 'MCP_NOTIFICATION';
    if (isJSONRPCResponse(message) || isJSONRPCError(message)) {
      messageType = 'MCP_RESPONSE';
    } else if (isJSONRPCNotification(message)) {
      messageType = 'MCP_NOTIFICATION';
    } else {
      messageType = 'MCP_REQUEST';
    }

    const transportMessage: BrowserTransportMessage = {
      type: messageType,
      connectionId: this._connectionId,
      serverId: this._serverId,
      data: message,
    };

    this._targetWindow.postMessage(transportMessage, this._targetOrigin);
  }

  /**
   * Closes the transport
   */
  async close(): Promise<void> {
    if (this._messageHandler) {
      window.removeEventListener('message', this._messageHandler);
    }

    this._started = false;
    this.onclose?.();
  }

  /**
   * Gets the current server information
   */
  get serverInfo(): BrowserServerInfo | undefined {
    return this._serverInfo;
  }

  /**
   * Gets available servers without connecting
   */
  static async discoverServers(options?: {
    targetWindow?: Window;
    targetOrigin?: string;
    timeout?: number;
  }): Promise<BrowserServerInfo[]> {
    const transport = new TabClientTransport(options);
    return transport.discover();
  }
}
