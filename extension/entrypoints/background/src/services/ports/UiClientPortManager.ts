import { ExtensionServerTransport } from '@mcp-b/transports';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * Initializes a listener for UI client connections from the sidepanel.
 * Connects each UI port to the shared MCP server using ExtensionServerTransport.
 */
export function initUiClientPortListener(server: McpServer): void {
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== 'mcp') return;

    console.log('[MCP Hub] UI client connected');
    const transport = new ExtensionServerTransport(port, {
      keepAlive: true,
      keepAliveInterval: 25_000,
    });
    server.connect(transport);
  });
}

