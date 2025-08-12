/**
 * MCP Connector Extension - Background Service Worker
 *
 * This background script manages the connection between your extension and the MCP-B extension.
 * It acts as a persistent proxy, maintaining the MCP client connection and handling all
 * communication between your extension's UI (popup) and the MCP-B extension.
 *
 * Key responsibilities:
 * - Establish and maintain connection to MCP-B extension via Chrome runtime ports
 * - Listen for dynamic tool list updates from websites
 * - Proxy tool execution requests from the popup
 * - Store connection state and available tools in Chrome storage
 *
 * @module background
 */

import { ExtensionClientTransport } from '@mcp-b/transports';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { ToolListChangedNotificationSchema } from '@modelcontextprotocol/sdk/types.js';

/**
 * Configuration
 * Update TARGET_EXTENSION_ID with your MCP-B extension's ID
 * Find it at: chrome://extensions/ when MCP-B is installed
 */
const TARGET_EXTENSION_ID = 'bkepebjhaemmkpedklgoobliehbbnlng'; // The actual MCP-B extension ID is daohopfhkdelnpemnhlekblhnikhdhfa
const PORT_NAME = 'mcp'; // Must be 'mcp' to match MCP-B's expected port name

// Global connection state
let mcpClient: Client | null = null;
let transport: ExtensionClientTransport | null = null;

/**
 * Connection status information stored in Chrome storage
 */
export interface ConnectionStatus {
  /** Whether currently connected to MCP-B */
  connected: boolean;
  /** The ID of the target MCP-B extension */
  extensionId: string;
  /** Error message if connection failed */
  error?: string;
}

/**
 * Establishes connection to the MCP-B extension
 *
 * This function:
 * 1. Cleans up any existing connection
 * 2. Creates a new ExtensionClientTransport for cross-extension communication
 * 3. Initializes the MCP client with your extension's identity
 * 4. Connects to MCP-B and sets up tool list change notifications
 * 5. Fetches initial tool list and stores in Chrome storage
 *
 * @throws Will store error in Chrome storage if connection fails
 */
async function connectToMcpExtension(): Promise<void> {
  try {
    // Step 1: Clean up any existing connection to prevent memory leaks
    if (mcpClient) {
      await mcpClient.close();
    }

    // Step 2: Create transport layer for cross-extension communication
    // ExtensionClientTransport uses chrome.runtime.connectExternal internally
    transport = new ExtensionClientTransport({
      extensionId: TARGET_EXTENSION_ID,
      portName: PORT_NAME,
    });

    // Step 3: Create MCP client with your extension's identity
    mcpClient = new Client({
      name: 'MCP-Connector-Example', // Your extension's name
      version: '1.0.0', // Your extension's version
    });

    // Step 4: Connect to the MCP-B extension server
    await mcpClient.connect(transport);
    console.log('[MCP Connector] Connected to MCP-B extension');

    // Step 5: Store successful connection status for popup UI
    await chrome.storage.local.set({
      connectionStatus: {
        connected: true,
        extensionId: TARGET_EXTENSION_ID,
      } as ConnectionStatus,
    });

    // Step 6: Set up notification handler for dynamic tool updates
    // This is crucial for detecting when websites register or update their tools
    const serverCapabilities = mcpClient.getServerCapabilities();
    if (serverCapabilities?.tools?.listChanged) {
      mcpClient.setNotificationHandler(ToolListChangedNotificationSchema, async () => {
        console.log('[MCP Connector] Tools list changed, fetching new tools...');
        try {
          // Safety check - client might have disconnected
          if (!mcpClient) return;

          // Fetch the updated tool list
          const { tools } = await mcpClient.listTools();
          console.log('[MCP Connector] Updated tools:', tools);

          // Store in Chrome storage for persistence
          await chrome.storage.local.set({ availableTools: tools });

          // Notify popup UI of the update (if it's open)
          chrome.runtime.sendMessage({ type: 'TOOLS_UPDATED', tools }).catch(() => {
            // Popup might not be open, this is normal - ignore the error
          });
        } catch (error) {
          console.error('[MCP Connector] Error fetching updated tools:', error);
        }
      });
    }

    // Step 7: Fetch initial tool list
    const { tools } = await mcpClient.listTools();
    console.log('[MCP Connector] Available tools:', tools);

    // Step 8: Store tools for popup to display
    await chrome.storage.local.set({ availableTools: tools });
  } catch (error) {
    // Connection failed - store error details for debugging
    console.error('[MCP Connector] Connection failed:', error);
    await chrome.storage.local.set({
      connectionStatus: {
        connected: false,
        extensionId: TARGET_EXTENSION_ID,
        error: error instanceof Error ? error.message : 'Unknown error',
      } as ConnectionStatus,
    });
  }
}

/**
 * WXT Background Script Definition
 * This configures the background service worker for the extension
 */
export default defineBackground({
  type: 'module',
  main() {
    /**
     * Message Handler for Popup Communication
     *
     * This listener handles all messages from the popup UI.
     * It supports the following message types:
     * - CONNECT: Establish connection to MCP-B
     * - DISCONNECT: Close connection to MCP-B
     * - LIST_TOOLS: Fetch all available tools
     * - CALL_TOOL: Execute a specific tool with arguments
     *
     * All operations are async and use sendResponse for results
     */
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
      (async () => {
        try {
          switch (request.type) {
            case 'CONNECT':
              // Establish connection to MCP-B extension
              await connectToMcpExtension();
              sendResponse({ success: true });
              break;

            case 'DISCONNECT':
              // Gracefully disconnect from MCP-B
              if (mcpClient) {
                // Remove notification handler to prevent memory leaks
                const serverCapabilities = mcpClient.getServerCapabilities();
                if (serverCapabilities?.tools?.listChanged) {
                  mcpClient.removeNotificationHandler('notifications/tools/list_changed');
                }
                // Close the MCP client connection
                await mcpClient.close();
                mcpClient = null;
                transport = null;
              }
              // Clear stored connection state
              await chrome.storage.local.set({
                connectionStatus: {
                  connected: false,
                  extensionId: TARGET_EXTENSION_ID,
                } as ConnectionStatus,
                availableTools: [],
              });
              sendResponse({ success: true });
              break;

            case 'LIST_TOOLS':
              // Fetch and return all available tools
              if (!mcpClient) {
                sendResponse({ error: 'Not connected' });
                break;
              }
              const { tools } = await mcpClient.listTools();
              await chrome.storage.local.set({ availableTools: tools });
              sendResponse({ tools });
              break;

            case 'CALL_TOOL':
              // Execute a specific tool with provided arguments
              if (!mcpClient) {
                sendResponse({ error: 'Not connected' });
                break;
              }
              const result = await mcpClient.callTool({
                name: request.toolName,
                arguments: request.arguments || {},
              });
              sendResponse({ result });
              break;

            default:
              sendResponse({ error: `Unknown request type: ${request.type}` });
          }
        } catch (error) {
          // Handle any errors during message processing
          console.error('[MCP Connector] Error handling message:', error);
          sendResponse({
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      })();
      // Return true to indicate async response
      return true;
    });

    /**
     * Auto-connect on Extension Installation
     * Automatically establishes connection when extension is first installed or updated
     */
    chrome.runtime.onInstalled.addListener(() => {
      console.log('[MCP Connector] Extension installed, connecting to MCP-B...');
      void connectToMcpExtension();
    });

    /**
     * Auto-connect on Browser Startup
     * Re-establishes connection when browser starts with extension already installed
     */
    chrome.runtime.onStartup.addListener(() => {
      console.log('[MCP Connector] Extension started, connecting to MCP-B...');
      void connectToMcpExtension();
    });

    console.log('[MCP Connector] Background script initialized');
  },
});
