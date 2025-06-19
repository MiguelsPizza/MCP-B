import { Transport, TransportSendOptions } from '@modelcontextprotocol/sdk/shared/transport.js';
import {
  Implementation,
  isJSONRPCError,
  isJSONRPCNotification,
  isJSONRPCRequest,
  isJSONRPCResponse,
  JSONRPCMessage,
  JSONRPCMessageSchema,
  LATEST_PROTOCOL_VERSION,
  RequestId,
  ServerCapabilities,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

/**
 * Message types for browser transport communication
 */
interface TabTransportMessage {
  type: 'MCP_REQUEST' | 'MCP_RESPONSE' | 'MCP_NOTIFICATION';
  connectionId: string; // Unique ID for this connection
  serverId: string; // Unique ID for this server instance
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
const TabTransportMessageSchema = z.object({
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
 * Configuration options for TabServerTransport
 */
export interface TabServerTransportOptions {
  /**
   * Server implementation details
   */
  serverInfo: Implementation;

  /**
   * Server capabilities to advertise during discovery
   */
  capabilities: ServerCapabilities;

  /**
   * Protocol version to use (defaults to latest)
   */
  protocolVersion?: string;

  /**
   * Optional server ID (will be auto-generated if not provided)
   * This helps differentiate between multiple servers on the same page
   */
  serverId?: string;
}

/**
 * Server transport for browser contexts using postMessage.
 * This transport allows web pages to expose MCP servers that can be discovered
 * and connected to by browser extensions or other browser contexts.
 *
 * Handles multiple clients (extensions) connecting to the same server.
 */
export class TabServerTransport implements Transport {
  private _started = false;
  private _serverId: string;
  private _serverInfo: Implementation;
  private _capabilities: ServerCapabilities;
  private _protocolVersion: string;
  private _activeConnections = new Set<string>(); // Track active connectionIds
  private _requestToConnection = new Map<RequestId, string>(); // Map request IDs to connection IDs
  private _messageHandler?: (event: MessageEvent) => void;

  sessionId?: string; // Not used in browser transport
  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;
  setProtocolVersion?: (version: string) => void;

  constructor(options: TabServerTransportOptions) {
    this._serverInfo = options.serverInfo;
    this._capabilities = options.capabilities;
    this._protocolVersion = options.protocolVersion || LATEST_PROTOCOL_VERSION;
    this._serverId = options.serverId || this._generateId();
  }

  /**
   * Generates a unique ID
   */
  private _generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Starts the transport and begins listening for messages
   */
  async start(): Promise<void> {
    if (this._started) {
      throw new Error('Transport already started');
    }

    this._started = true;

    // Set up message listener
    this._messageHandler = (event: MessageEvent) => {
      this._handleMessage(event);
    };

    window.addEventListener('message', this._messageHandler);
  }

  /**
   * Handles incoming messages
   */
  private _handleMessage(event: MessageEvent): void {
    // Validate message structure
    if (!event.data || typeof event.data !== 'object') {
      return;
    }

    // Handle discovery messages
    if (event.data.type === 'MCP_DISCOVERY_REQUEST') {
      try {
        const discoveryMessage = DiscoveryMessageSchema.parse(event.data);
        this._handleDiscoveryRequest(event, discoveryMessage);
      } catch (error) {
        // Invalid discovery message, ignore
      }
      return;
    }

    // Handle MCP messages
    if (event.data.type === 'MCP_REQUEST' || event.data.type === 'MCP_NOTIFICATION') {
      try {
        const transportMessage = TabTransportMessageSchema.parse(event.data);
        this._handleMCPMessage(transportMessage);
      } catch (error) {
        this.onerror?.(new Error(`Failed to parse browser transport message: ${error}`));
      }
    }
  }

  /**
   * Responds to discovery requests
   */
  private _handleDiscoveryRequest(event: MessageEvent, message: DiscoveryMessage): void {
    // Send discovery response
    const response: DiscoveryMessage = {
      type: 'MCP_DISCOVERY_RESPONSE',
      connectionId: message.connectionId,
      serverId: this._serverId,
      serverInfo: {
        implementation: this._serverInfo,
        capabilities: this._capabilities,
        protocolVersion: this._protocolVersion,
      },
    };

    // Post response back to the source
    if (event.source) {
      (event.source as Window).postMessage(response, event.origin);
    }
  }

  /**
   * Handles MCP messages from clients
   */
  private _handleMCPMessage(message: z.infer<typeof TabTransportMessageSchema>): void {
    // Validate it's intended for this server
    if (message.serverId !== this._serverId) {
      return;
    }

    // Track active connections
    if (message.connectionId && !this._activeConnections.has(message.connectionId)) {
      this._activeConnections.add(message.connectionId);
    }

    try {
      const mcpMessage = JSONRPCMessageSchema.parse(message.data);

      // Track request source for routing responses
      if (isJSONRPCRequest(mcpMessage)) {
        this._requestToConnection.set(mcpMessage.id, message.connectionId);
      }

      // Forward to server handler
      this.onmessage?.(mcpMessage);
    } catch (error) {
      this.onerror?.(new Error(`Failed to parse MCP message: ${error}`));
    }
  }

  /**
   * Sends a message to client(s)
   */
  async send(message: JSONRPCMessage, options?: TransportSendOptions): Promise<void> {
    if (!this._started) {
      throw new Error('Transport not started');
    }

    let targetConnectionId: string | undefined;

    // Determine target connection(s) based on message type and options
    if (isJSONRPCResponse(message) || isJSONRPCError(message)) {
      // Responses go back to the requester
      targetConnectionId = this._requestToConnection.get(message.id);
      if (!targetConnectionId) {
        throw new Error(`No connection found for request ID: ${message.id}`);
      }
      // Clean up mapping
      this._requestToConnection.delete(message.id);
    } else if (options?.relatedRequestId) {
      // If we have a relatedRequestId, route to the same client that made the original request
      targetConnectionId = this._requestToConnection.get(options.relatedRequestId);
    } else if (isJSONRPCRequest(message)) {
      // Server-initiated requests need special handling
      // For now, we'll broadcast to all connections
      // In practice, you might want to track which client to send to
    } else if (isJSONRPCNotification(message)) {
      // Notifications can be broadcast or targeted
      // Check if this is a response to a specific request
      // For now, broadcast to all
    }

    // Prepare transport message
    const transportMessage: TabTransportMessage = {
      type: isJSONRPCRequest(message)
        ? 'MCP_REQUEST'
        : isJSONRPCResponse(message) || isJSONRPCError(message)
          ? 'MCP_RESPONSE'
          : 'MCP_NOTIFICATION',
      serverId: this._serverId,
      connectionId: targetConnectionId || '', // Empty string for broadcasts
      data: message,
    };

    if (targetConnectionId) {
      // Send to specific connection
      window.postMessage(transportMessage, '*');
    } else {
      // Broadcast to all active connections
      for (const connectionId of this._activeConnections) {
        window.postMessage(
          {
            ...transportMessage,
            connectionId,
          },
          '*'
        );
      }
    }
  }

  /**
   * Closes the transport
   */
  async close(): Promise<void> {
    if (this._messageHandler) {
      window.removeEventListener('message', this._messageHandler);
    }

    this._activeConnections.clear();
    this._requestToConnection.clear();
    this._started = false;
    this.onclose?.();
  }

  /**
   * Gets the active connection IDs
   */
  get activeConnections(): ReadonlySet<string> {
    return this._activeConnections;
  }
}
