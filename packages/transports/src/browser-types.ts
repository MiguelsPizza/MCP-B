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

export enum NativeMessageType {
  START = 'start',
  STARTED = 'started',
  STOP = 'stop',
  STOPPED = 'stopped',
  PING = 'ping',
  PONG = 'pong',
  ERROR = 'error',
  LIST_TOOLS = 'list_tools',
  CALL_TOOL = 'call_tool',
  TOOL_LIST_UPDATED = 'tool_list_updated',
  TOOL_LIST_UPDATED_ACK = 'tool_list_updated_ack',
  PROCESS_DATA = 'process_data',

  // Additional message types used in Chrome extension
  SERVER_STARTED = 'server_started',
  SERVER_STOPPED = 'server_stopped',
  ERROR_FROM_NATIVE_HOST = 'error_from_native_host',
  CONNECT_NATIVE = 'connectNative',
  PING_NATIVE = 'ping_native',
  DISCONNECT_NATIVE = 'disconnect_native',
}

/**
 * Chrome Extension Constants
 * Centralized configuration values and magic constants
 */

// Native Host Configuration
export const NATIVE_HOST = {
  NAME: 'com.chromemcp.nativehost',
  DEFAULT_PORT: 12306,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NATIVE_CONNECTION_FAILED: 'Failed to connect to native host',
  NATIVE_DISCONNECTED: 'Native connection disconnected',
  SERVER_STATUS_LOAD_FAILED: 'Failed to load server status',
  TOOL_EXECUTION_FAILED: 'Tool execution failed',
  SERVER_STATUS_SAVE_FAILED: 'Failed to save server status',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  TOOL_EXECUTED: 'Tool executed successfully',
  CONNECTION_ESTABLISHED: 'Connection established',
  SERVER_STARTED: 'Server started successfully',
  SERVER_STOPPED: 'Server stopped successfully',
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  SERVER_STATUS: 'serverStatus',
} as const;

// Background script message types
export const BACKGROUND_MESSAGE_TYPES = {
  GET_SERVER_STATUS: 'get_server_status',
  REFRESH_SERVER_STATUS: 'refresh_server_status',
  SERVER_STATUS_CHANGED: 'server_status_changed',
} as const;

export const HOST_NAME = NATIVE_HOST.NAME;

/**
 * Server status management interface
 */
export interface ServerStatus {
  isRunning: boolean;
  port?: number;
  lastUpdated: number;
}
