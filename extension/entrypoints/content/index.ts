// content-scripts/content.ts

import { TabClientTransport } from '@mcp-b/transports';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { ToolListChangedNotificationSchema } from '@modelcontextprotocol/sdk/types.js';
import { defineContentScript } from '#imports';

// Types

interface ToolExecutionMessage {
  type: 'execute-tool';
  toolName: string;
  requestId: string;
  args?: Record<string, unknown>;
}

interface ToolResultMessage {
  type: 'tool-result';
  requestId: string;
  data: {
    success: boolean;
    payload: unknown;
  };
}

let cachedToolHashes: Map<string, string> = new Map();

async function checkForToolUpdates(
  client: Client,
  port: chrome.runtime.Port,
  sendType: 'register-tools' | 'tools-updated' = 'tools-updated'
): Promise<void> {
  try {
    const pageTools = await client.listTools();
    const newTools = pageTools.tools;
    const newHashes = new Map<string, string>();
    let changed = false;
    const seen = new Set<string>();

    for (const tool of newTools) {
      if (!tool.name) {
        console.error('Tool without name');
        continue;
      }
      const json = JSON.stringify(tool);
      newHashes.set(tool.name, json);
      seen.add(tool.name);
      if (!cachedToolHashes.has(tool.name) || cachedToolHashes.get(tool.name) !== json) {
        changed = true;
      }
    }

    // Check for removed tools
    for (const name of cachedToolHashes.keys()) {
      if (!seen.has(name)) {
        changed = true;
      }
    }

    if (changed || sendType === 'register-tools') {
      // Always send for initial registration if tools are fetched
      port.postMessage({
        type: sendType,
        tools: newTools,
      });
      cachedToolHashes = newHashes;
      console.log(`[MCP Proxy] Sent ${sendType} with ${newTools.length} tools to hub.`);
    } else {
      console.log('[MCP Proxy] No changes in tool list, skipping update.');
    }
  } catch (error) {
    console.error('[MCP Proxy] Failed to check for tool updates:', error);
    
    // If we can't get tools (server might be disconnected), send empty tools list
    // but only if we previously had tools cached
    if (cachedToolHashes.size > 0) {
      console.log('[MCP Proxy] Server appears disconnected, sending empty tools list');
      port.postMessage({
        type: 'tools-updated',
        tools: [],
      });
      cachedToolHashes.clear();
    }
  }
}

// Tool execution
async function executeToolRequest(
  client: Client,
  message: ToolExecutionMessage
): Promise<ToolResultMessage> {
  console.log(`[MCP Proxy] Relaying call for '${message.toolName}' to the page's MCP server.`);

  console.log('[MCP Proxy] Tool call details:', {
    toolName: message.toolName,
    args: message.args,
    hasClient: !!client,
  });

  try {
    // Ensure args is at least an empty object
    const args = message.args || {};
    // Execute the tool
    const result = await client.callTool({
      name: message.toolName,
      arguments: args,
    });

    console.log('[MCP Proxy] Tool call succeeded:', message.toolName);

    return {
      type: 'tool-result',
      requestId: message.requestId,
      data: { success: true, payload: result },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[MCP Proxy] Tool call failed:', error);

    // Check if this is a "Method not found" error
    if (errorMessage.includes('Method not found')) {
      const tools = await client.listTools();
      console.error('[MCP Proxy] Available tools:', tools);
    }

    return {
      type: 'tool-result',
      requestId: message.requestId,
      data: { success: false, payload: errorMessage },
    };
  }
}

// Message handling
function setupMessageHandler(client: Client, port: chrome.runtime.Port): void {
  port.onMessage.addListener(async (message) => {
    if (message.type === 'execute-tool' && message.toolName && message.requestId) {
      if (!client) {
        console.error('[MCP Proxy] No page client available');
        port.postMessage({
          type: 'tool-result',
          requestId: message.requestId,
          data: { success: false, payload: 'No page client connected' },
        });
        return;
      }

      if (!message.requestId) {
        console.warn('[MCP Proxy] Received tool request without requestId, ignoring');
        return;
      }

      const result = await executeToolRequest(client, message);
      port.postMessage(result);
    }
  });
}

// Export the content script
export default defineContentScript({
  matches: ['<all_urls>'],
  async main() {
    console.log('[MCP Proxy] Initializing MCP proxy...');

    let client: Client | null = null;
    let transport: TabClientTransport | null = null;
    let isConnected = false;

    // Connect to background
    const backgroundPort = chrome.runtime.connect({
      name: 'mcp-content-script-proxy',
    });

    // Helper function for timeout promise
    const timeoutPromise = (ms: number, message: string) =>
      new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms));

    // Function to attempt connection to MCP server
    async function attemptConnection(): Promise<void> {
      if (isConnected) {
        console.log('[MCP Proxy] Already connected, skipping connection attempt');
        return;
      }

      // Create new client and transport for each connection attempt
      client = new Client({
        name: 'ExtensionProxyClient',
        version: '1.0.0',
      });

      transport = new TabClientTransport({
        targetOrigin: window.location.origin,
      });

      try {
        // Start connection process
        const connectPromise = client.connect(transport);

        // Race with initial timeout for logging
        const racePromise = Promise.race([
          connectPromise,
          timeoutPromise(30000, 'Server ready timeout after 30 seconds'),
        ]);

        racePromise.catch((error) => {
          if (error.message.includes('timeout')) {
            console.log(
              '[MCP Proxy] No MCP server found on this page (timeout), but will continue waiting for late initialization.'
            );
          } else {
            throw error;
          }
        });

        // Await the actual connect promise (may resolve later)
        await connectPromise;
        isConnected = true;

        console.log('[MCP Proxy] Client connected to transport');

        // Get server capabilities to verify connection
        const capabilities = await client.getServerCapabilities();
        console.log('[MCP Proxy] Server capabilities:', capabilities);

        const tools = await client.listTools();
        console.log('first tools', tools);
        console.log('[MCP Proxy] Tools:', tools);

        backgroundPort.postMessage({
          type: 'register-tools',
          tools: tools.tools,
        });

        // Register tools with background (initial check and send)
        await checkForToolUpdates(client, backgroundPort, 'register-tools');

        // Setup message handler for tool execution
        setupMessageHandler(client, backgroundPort);

        // Setup handler for tools refresh requests
        backgroundPort.onMessage.addListener(async (message) => {
          if (message.type === 'request-tools-refresh') {
            if (!client) {
              console.error('[MCP Proxy] No page client available for refresh');
              return;
            }
            await checkForToolUpdates(client, backgroundPort);
          }
        });

        // Listen for tool list change notifications from the server
        if (capabilities?.tools?.listChanged) {
          console.log('[MCP Proxy] Server supports tool list change notifications');

          // Set up notification handler for tool list changes
          client.setNotificationHandler(ToolListChangedNotificationSchema, async () => {
            console.log('[MCP Proxy] Received tool list change notification from server');
            await checkForToolUpdates(client, backgroundPort);
          });
        } else {
          console.log('[MCP Proxy] Server does not support tool list change notifications');

          // Fallback: periodically check for tool updates every 30 seconds
          setInterval(async () => {
            await checkForToolUpdates(client, backgroundPort);
          }, 30000);
        }

        console.log('[MCP Proxy] Successfully connected to page server');
      } catch (error) {
        console.error('[MCP Proxy] Error connecting to server:', error);
        isConnected = false;
      }
    }

    // Listen for custom event indicating MCP server has stopped
    window.addEventListener('mcp-server-stopped', () => {
      console.log('[MCP Proxy] Received mcp-server-stopped event, clearing tools');
      backgroundPort.postMessage({
        type: 'tools-updated',
        tools: [],
      });
      cachedToolHashes.clear();
      isConnected = false;
      
      // Close current transport if it exists
      if (transport) {
        transport.close();
        transport = null;
      }
      client = null;
    });

    // Listen for MCP server ready events (including new servers starting)
    window.addEventListener('message', (event) => {
      // Check if this is an mcp-server-ready message
      if (
        event.origin === window.location.origin &&
        event.data?.type === 'mcp' &&
        event.data?.direction === 'server-to-client' &&
        event.data?.payload === 'mcp-server-ready'
      ) {
        console.log('[MCP Proxy] Detected MCP server ready, attempting connection');
        attemptConnection().catch((error) => {
          console.error('[MCP Proxy] Failed to connect to new server:', error);
        });
      }
    });

    // Initial connection attempt
    await attemptConnection();

    // Clean up on disconnect
    backgroundPort.onDisconnect.addListener(() => {
      if (transport) {
        transport.close();
      }
    });
  },
});
