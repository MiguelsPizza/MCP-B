/**
 * Type Definitions for MCP Connector Extension
 *
 * This file contains all TypeScript interfaces and types used throughout
 * the extension. These types ensure type safety when communicating between
 * the popup UI and background service worker.
 *
 * @module types
 */

/**
 * Represents an MCP tool exposed by the MCP-B extension
 * Tools can be from Chrome Extension APIs or website-registered tools
 */
export interface Tool {
  /**
   * Unique tool identifier
   * Format:
   * - Extension tools: `extension_<api>_<method>`
   * - Website tools: `website_tool_<domain>_<tab>_<toolname>`
   */
  name: string;

  /** Human-readable description of what the tool does */
  description?: string;

  /**
   * JSON Schema defining the tool's input parameters
   * Used for validation and documentation
   */
  inputSchema?: {
    type: 'object';
    properties?: Record<string, any>;
    required?: string[];
  };

  /**
   * JSON Schema defining the tool's output format
   * Optional - not all tools define output schemas
   */
  outputSchema?: {
    type: 'object';
    properties?: Record<string, any>;
  };

  /** Tool title for display purposes */
  title?: string;

  /** Additional metadata about the tool */
  annotations?: {
    /** Whether the tool results should be cached */
    cache?: boolean;
    /** Any other custom annotations */
    [key: string]: any;
  };
}

/**
 * Connection status information
 * Stored in Chrome storage for persistence across popup opens
 */
export interface ConnectionStatus {
  /** Whether currently connected to MCP-B extension */
  connected: boolean;

  /** The ID of the target MCP-B extension */
  extensionId: string;

  /** Error message if connection failed */
  error?: string;

  /** Timestamp of last connection attempt */
  lastAttempt?: number;

  /** Timestamp of successful connection */
  connectedAt?: number;
}

/**
 * Result from executing a tool
 */
export interface ToolResult {
  /** Whether the tool execution succeeded */
  type: 'success' | 'error';

  /** The tool's return data (for successful executions) */
  data?: any;

  /** Error message (for failed executions) */
  error?: string;

  /** Execution timestamp */
  timestamp?: number;
}

/**
 * Message types for communication between popup and background
 */
export type MessageType =
  | 'CONNECT'
  | 'DISCONNECT'
  | 'LIST_TOOLS'
  | 'LIST_EXTENSION_TOOLS'
  | 'LIST_WEBSITE_TOOLS'
  | 'CALL_TOOL'
  | 'TOOLS_UPDATED';

/**
 * Base message structure for all communications
 */
export interface BaseMessage {
  /** The type of message being sent */
  type: MessageType;

  /** Unique ID for tracking request/response pairs */
  id?: string;
}

/**
 * Connect message - establishes connection to MCP-B
 */
export interface ConnectMessage extends BaseMessage {
  type: 'CONNECT';
}

/**
 * Disconnect message - closes connection to MCP-B
 */
export interface DisconnectMessage extends BaseMessage {
  type: 'DISCONNECT';
}

/**
 * List tools message - fetches all available tools
 */
export interface ListToolsMessage extends BaseMessage {
  type: 'LIST_TOOLS';
}

/**
 * List extension tools message - fetches only extension API tools
 */
export interface ListExtensionToolsMessage extends BaseMessage {
  type: 'LIST_EXTENSION_TOOLS';
}

/**
 * List website tools message - fetches website-registered tools
 */
export interface ListWebsiteToolsMessage extends BaseMessage {
  type: 'LIST_WEBSITE_TOOLS';
  /** Optional domain filter */
  domain?: string;
}

/**
 * Call tool message - executes a specific tool
 */
export interface CallToolMessage extends BaseMessage {
  type: 'CALL_TOOL';
  /** Name of the tool to execute */
  toolName: string;
  /** Arguments to pass to the tool */
  arguments: Record<string, any>;
}

/**
 * Tools updated message - sent from background to popup
 */
export interface ToolsUpdatedMessage extends BaseMessage {
  type: 'TOOLS_UPDATED';
  /** Updated list of tools */
  tools: Tool[];
}

/**
 * Union type of all message types
 */
export type Message =
  | ConnectMessage
  | DisconnectMessage
  | ListToolsMessage
  | ListExtensionToolsMessage
  | ListWebsiteToolsMessage
  | CallToolMessage
  | ToolsUpdatedMessage;

/**
 * Response structure for messages
 */
export interface MessageResponse {
  /** Whether the operation succeeded */
  success?: boolean;

  /** Error message if operation failed */
  error?: string;

  /** Tools list (for LIST_TOOLS responses) */
  tools?: Tool[];

  /** Tool execution result (for CALL_TOOL responses) */
  result?: any;

  /** Request ID for matching responses */
  id?: string;
}

/**
 * Chrome storage structure
 */
export interface StorageData {
  /** Current connection status */
  connectionStatus?: ConnectionStatus;

  /** List of available tools */
  availableTools?: Tool[];

  /** User's favorite tools */
  favorites?: string[];

  /** Tool execution history */
  history?: HistoryEntry[];

  /** User preferences */
  preferences?: UserPreferences;
}

/**
 * Tool execution history entry
 */
export interface HistoryEntry {
  /** Name of the executed tool */
  toolName: string;

  /** Arguments passed to the tool */
  arguments: Record<string, any>;

  /** Result of the execution */
  result: any;

  /** Execution timestamp */
  timestamp: number;

  /** Whether execution succeeded */
  success: boolean;

  /** Execution duration in milliseconds */
  duration?: number;
}

/**
 * User preferences
 */
export interface UserPreferences {
  /** Theme preference */
  theme?: 'light' | 'dark' | 'system';

  /** Whether to show tool descriptions */
  showDescriptions?: boolean;

  /** Whether to auto-connect on startup */
  autoConnect?: boolean;

  /** Maximum history entries to keep */
  maxHistoryEntries?: number;

  /** Default JSON formatting for arguments */
  jsonFormatting?: {
    indent?: number;
    sortKeys?: boolean;
  };
}

/**
 * Tool category for filtering
 */
export type ToolCategory = 'all' | 'extension' | 'website';

/**
 * Tool metadata for enhanced display
 */
export interface ToolMetadata {
  /** Tool identifier */
  name: string;

  /** Category the tool belongs to */
  category: ToolCategory;

  /** API group (for extension tools) */
  apiGroup?: string;

  /** Domain (for website tools) */
  domain?: string;

  /** Tab ID (for website tools) */
  tabId?: number;

  /** Whether tool is cached */
  isCached?: boolean;

  /** Last execution time */
  lastExecuted?: number;

  /** Execution count */
  executionCount?: number;
}

/**
 * Connection state enum for UI display
 */
export enum ConnectionState {
  /** Not connected */
  DISCONNECTED = 'disconnected',

  /** Currently connecting */
  CONNECTING = 'connecting',

  /** Successfully connected */
  CONNECTED = 'connected',

  /** Connection error */
  ERROR = 'error',

  /** Reconnecting after disconnect */
  RECONNECTING = 'reconnecting',
}

/**
 * Error types for better error handling
 */
export enum ErrorType {
  /** Connection-related errors */
  CONNECTION = 'connection',

  /** Tool execution errors */
  EXECUTION = 'execution',

  /** Invalid input/arguments */
  VALIDATION = 'validation',

  /** Permission-related errors */
  PERMISSION = 'permission',

  /** Unknown/unexpected errors */
  UNKNOWN = 'unknown',
}

/**
 * Extended error information
 */
export interface ExtendedError {
  /** Error type category */
  type: ErrorType;

  /** Error message */
  message: string;

  /** Optional error code */
  code?: string;

  /** Stack trace (for debugging) */
  stack?: string;

  /** Additional context */
  context?: Record<string, any>;

  /** Timestamp when error occurred */
  timestamp: number;
}

/**
 * Type guards for message type checking
 */
export const MessageTypeGuards = {
  isConnectMessage: (msg: Message): msg is ConnectMessage => msg.type === 'CONNECT',

  isDisconnectMessage: (msg: Message): msg is DisconnectMessage => msg.type === 'DISCONNECT',

  isListToolsMessage: (msg: Message): msg is ListToolsMessage => msg.type === 'LIST_TOOLS',

  isCallToolMessage: (msg: Message): msg is CallToolMessage => msg.type === 'CALL_TOOL',

  isToolsUpdatedMessage: (msg: Message): msg is ToolsUpdatedMessage => msg.type === 'TOOLS_UPDATED',
};

/**
 * Utility type for tool name parsing
 */
export interface ParsedToolName {
  /** Full tool name */
  full: string;

  /** Tool type (extension/website) */
  type: 'extension' | 'website';

  /** Specific parts based on type */
  parts: {
    /** For extension tools: API name */
    api?: string;

    /** For extension tools: Method name */
    method?: string;

    /** For website tools: Domain */
    domain?: string;

    /** For website tools: Tab identifier */
    tab?: string;

    /** For website tools: Tool name */
    tool?: string;
  };
}

/**
 * Helper function to parse tool names
 */
export function parseToolName(name: string): ParsedToolName {
  const parts = name.split('_');

  if (name.startsWith('extension_')) {
    return {
      full: name,
      type: 'extension',
      parts: {
        api: parts[1],
        method: parts.slice(2).join('_'),
      },
    };
  } else if (name.startsWith('website_tool_')) {
    return {
      full: name,
      type: 'website',
      parts: {
        domain: parts[2],
        tab: parts[3],
        tool: parts.slice(4).join('_'),
      },
    };
  }

  // Default fallback
  return {
    full: name,
    type: 'extension',
    parts: {},
  };
}
