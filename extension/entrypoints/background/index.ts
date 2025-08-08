import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import McpHub from './src/services/mcpHub';
import { initNativeHostListener } from './src/services/NativeHostManager';
import { initExternalExtensionPortListener } from './src/services/ports/ExternalExtensionPortManager';
import { initUiClientPortListener } from './src/services/ports/UiClientPortManager';
import { initSidepanelHandlers } from './src/services/sidepanel';

export default defineBackground({
  persistent: true,
  type: 'module',
  main() {
    const sharedServer = new McpServer({ name: 'Extension-Hub', version: '1.0.0' });
    new McpHub(sharedServer);

    // Connect sidepanel UI clients to the shared server
    initUiClientPortListener(sharedServer);

    // Accept external extension connections. Each external extension gets its own server instance.
    initExternalExtensionPortListener((extensionId) => {
      const server = new McpServer({ name: extensionId, version: '1.0.0' });
      new McpHub(server);
      return server;
    });

    // Native host and sidepanel behavior
    initNativeHostListener();
    initSidepanelHandlers();
  },
});
