import { type JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import {
  type MCPConnectOptions,
  type MCPEventMessage,
  type MCPReplayEventMessage,
  type MCPServerInfoMessage,
} from '../browser-types';

/**
 * Union type representing all possible message types that can be sent through the page bridge.
 * This includes MCP server information, events, replay events, and JSON-RPC messages.
 */
export type PageBridgeMessageType =
  | MCPServerInfoMessage
  | MCPEventMessage
  | MCPReplayEventMessage
  | JSONRPCMessage
  | {
      type: 'mcp-server-disconnected';
      reason: string;
    };

/**
 * Response structure for messages received from the bridge.
 */
export interface BridgeResponse {
  /** Unique identifier for the client connection */
  clientId: string;
  /** The actual message payload */
  msg: PageBridgeMessageType;
}

/**
 * Message structure for commands sent to the bridge.
 */
export interface BridgeMessage {
  /** Command type - either 'connect' to establish a connection or 'send' to send a message */
  cmd: 'connect' | 'send' | 'disconnect';
  /** Unique identifier for the client connection */
  clientId: string;
  /** Connection options, required when cmd is 'connect' */
  options?: MCPConnectOptions;
  /** JSON-RPC message to send, required when cmd is 'send' */
  message?: JSONRPCMessage;
}

/**
 * Creates a UI bridge for communicating with MCP servers from browser extension UI components.
 *
 * This function establishes a connection to the extension's background script via Chrome's
 * runtime messaging API, allowing UI components like sidebars and popups to interact with
 * MCP servers.
 *
 * @param port - Optional Chrome runtime port to use for communication. If not provided,
 *   a new port will be created with the name 'extensionUI'.
 *
 *   The port should be connected to your background script's chrome.runtime.onConnect listener.
 *
 * @returns An object with methods to interact with MCP servers:
 *   - connect: Establish a connection to an MCP server
 *   - send: Send JSON-RPC messages to a connected server
 *   - onMessage: Listen for responses and events from the server
 *
 * @example
 * ```typescript
 * // In your sidebar/popup code:
 * import { createUIBridge } from '@modelcontextprotocol/sdk/extension-bridge/uiConnector';
 *
 * // Using default port
 * const bridge = createUIBridge();
 *
 * // Or using a custom port
 * const customPort = chrome.runtime.connect({ name: 'sidebar' });
 * const bridge = createUIBridge(customPort);
 *
 * // Connect to an MCP server
 * bridge.connect('my-client-id', {
 *   serverName: 'my-server',
 *   command: 'node',
 *   args: ['server.js']
 * });
 *
 * // Listen for messages
 * bridge.onMessage((response) => {
 *   console.log('Received:', response.msg);
 * });
 *
 * // Send a message
 * bridge.send('my-client-id', {
 *   jsonrpc: '2.0',
 *   id: 1,
 *   method: 'tools/list'
 * });
 * ```
 */
export function createUIBridge(
  port: chrome.runtime.Port = chrome.runtime.connect({ name: 'extensionUI' })
) {
  return {
    /**
     * Establishes a connection to an MCP server.
     *
     * @param clientId - Unique identifier for this client connection
     * @param options - Configuration options for the MCP server connection
     */
    connect: (clientId: string, options?: MCPConnectOptions) => {
      console.log({ clientId, options });
      port.postMessage({ cmd: 'connect', clientId, options });
    },

    /**
     * Sends a JSON-RPC message to a connected MCP server.
     *
     * @param clientId - The client ID of the connection to send the message through
     * @param message - The JSON-RPC message to send
     */
    send: (clientId: string, message: JSONRPCMessage) => {
      console.log({ clientId, message });
      port.postMessage({ cmd: 'send', clientId, message });
    },

    /**
     * Registers a handler for incoming messages from MCP servers.
     *
     * @param handler - Function to handle incoming bridge responses
     */
    onMessage: (handler: (resp: BridgeResponse) => void) => {
      port.onMessage.addListener(handler);
    },
  };
}
