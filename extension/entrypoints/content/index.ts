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

// Tool registration
async function registerTools(client: Client, port: chrome.runtime.Port): Promise<void> {
  try {
    const pageTools = await client.listTools();
    console.log({ pageTools });

    port.postMessage({
      type: 'register-tools',
      tools: pageTools.tools,
    });

    console.log(
      `[MCP Proxy] Registered ${pageTools.tools.length} page tools with the background hub.`
    );
  } catch (error) {
    console.error('[MCP Proxy] Failed to register tools:', error);
  }
}

// Tool update notification
async function notifyToolListChanged(client: Client, port: chrome.runtime.Port): Promise<void> {
  try {
    const pageTools = await client.listTools();
    console.log('[MCP Proxy] Tool list changed, updating hub with new tools:', pageTools);

    port.postMessage({
      type: 'tools-updated',
      tools: pageTools.tools,
    });

    console.log(`[MCP Proxy] Updated hub with ${pageTools.tools.length} tools after list change.`);
  } catch (error) {
    console.error('[MCP Proxy] Failed to update tools after list change:', error);
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

    // Create client
    const client = new Client({
      name: 'ExtensionProxyClient',
      version: '1.0.0',
    });

    // Connect to background
    const backgroundPort = chrome.runtime.connect({
      name: 'mcp-content-script-proxy',
    });

    // Setup transport
    const transport = new TabClientTransport({
      targetOrigin: window.location.origin,
    });

    try {
      // Connect the client (this will start the transport internally)
      await client.connect(transport);
      console.log('[MCP Proxy] Client connected to transport');

      // Wait for server to be ready with timeout

      console.log('[MCP Proxy] Server is ready');

      // Get server capabilities to verify connection
      const capabilities = await client.getServerCapabilities();
      const tools = await client.listTools();
      console.log('[MCP Proxy] Tools:', tools);

      if (!capabilities) {
        await Promise.race([
          transport.serverReadyPromise,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Server ready timeout after 30 seconds')), 30000)
          ),
        ]);
      }

      console.log('[MCP Proxy] Server capabilities:', capabilities);

      // Register tools with background
      await registerTools(client, backgroundPort);

      // Setup message handler for tool execution
      setupMessageHandler(client, backgroundPort);

      // Listen for tool list change notifications from the server
      if (capabilities?.tools?.listChanged) {
        console.log('[MCP Proxy] Server supports tool list change notifications');

        // Set up notification handler for tool list changes
        client.setNotificationHandler(ToolListChangedNotificationSchema, async () => {
          console.log('[MCP Proxy] Received tool list change notification from server');
          await notifyToolListChanged(client, backgroundPort);
        });
      } else {
        console.log('[MCP Proxy] Server does not support tool list change notifications');

        // Fallback: periodically check for tool updates every 30 seconds
        setInterval(async () => {
          try {
            const currentTools = await client.listTools();
            // Note: We're sending updates regardless of changes since we can't easily compare
            // The hub will handle deduplication
            backgroundPort.postMessage({
              type: 'tools-updated',
              tools: currentTools.tools,
            });
          } catch (error) {
            console.error('[MCP Proxy] Failed to poll for tool updates:', error);
          }
        }, 30000);
      }

      console.log('[MCP Proxy] Successfully connected to page server');
    } catch (error) {
      if (error instanceof Error && error.message.includes('timeout')) {
        console.log('[MCP Proxy] No MCP server found on this page (timeout)');
      } else {
        console.error('[MCP Proxy] Error connecting to server:', error);
      }
    }

    // Clean up on disconnect
    backgroundPort.onDisconnect.addListener(() => {
      transport.close();
    });
  },
});
