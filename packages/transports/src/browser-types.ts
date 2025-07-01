import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';

/**
 * Unique identifier for an event in the event store
 */
export type EventId = string;

/**
 * Unique identifier for a stream of events
 */
export type StreamId = string;

/**
 * Options for connecting to an MCP server
 */
export interface MCPConnectOptions {
  /**
   * The event ID to resume from if reconnecting
   */
  resumeFrom?: EventId;
}

/**
 * Information about the MCP server
 */
export interface MCPServerInfo {
  /**
   * Unique identifier for this server instance
   */
  instanceId: string;
  /**
   * Whether the server maintains session state
   */
  stateful: boolean;
  /**
   * Whether the server has event storage enabled
   */
  hasEventStore: boolean;
}

/**
 * Event storage interface for accessing stored events
 */
export interface MCPEventStore {
  /**
   * Get stored events, optionally filtered by client and/or after a specific event
   * @param clientId - Optional client ID to filter events
   * @param afterEventId - Optional event ID to get events after
   * @param limit - Maximum number of events to return (default: 100)
   */
  getEvents(clientId?: string, afterEventId?: EventId, limit?: number): StoredEvent[];

  /**
   * Get the ID of the last event, optionally for a specific client
   * @param clientId - Optional client ID to filter by
   */
  getLastEventId(clientId?: string): EventId | null;

  /**
   * Clear stored events, optionally for a specific client
   * @param clientId - Optional client ID to clear events for
   */
  clearEvents(clientId?: string): void;
}

/**
 * The MCP interface exposed on window for browser environments
 */
export interface MCPBrowserInterface {
  /**
   * Connect a client to the MCP server
   * @param clientId - Unique identifier for the client
   * @param options - Optional connection options
   * @returns MessagePort for communication or null if connection fails
   */
  connect(clientId: string, options?: MCPConnectOptions): MessagePort | null;

  /**
   * Disconnect a client from the MCP server
   * @param clientId - The client ID to disconnect
   */
  disconnect(clientId: string): void;

  /**
   * Terminate a client's session and clean up all associated resources
   * @param clientId - The client ID to terminate
   */
  terminateSession?(clientId: string): void;

  /**
   * Check if the MCP server is available and running
   */
  isServerAvailable(): boolean;

  /**
   * Get information about the MCP server
   */
  getServerInfo(): MCPServerInfo;

  /**
   * Event storage access (only available in stateful mode with event store)
   */
  events?: MCPEventStore;
}

/**
 * Extended Window interface with MCP support
 */
export interface MCPWindow extends Window {
  mcp?: MCPBrowserInterface;
}

/**
 * Message types for internal MCP communication
 */
export interface MCPServerInfoMessage {
  type: 'mcp-server-info';
  serverInstanceId: string;
  serverSessionId?: string;
  hasEventStore: boolean;
  streamId: StreamId;
}

export interface MCPEventMessage {
  type: 'mcp-event';
  eventId: EventId;
  message: JSONRPCMessage;
}

export interface MCPReplayEventMessage {
  type: 'mcp-replay-event';
  eventId: EventId;
  message: JSONRPCMessage;
}

/**
 * Stored event with metadata for event sourcing
 */
export interface StoredEvent {
  eventId: EventId;
  streamId: StreamId;
  message: JSONRPCMessage;
  timestamp: number;
  clientId: string;
}
