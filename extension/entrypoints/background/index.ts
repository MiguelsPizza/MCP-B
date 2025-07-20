import { ExtensionServerTransport } from '@mcp-b/transports';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import McpHub from './src/services/mcpHub';
import { initNativeHostListener } from './src/services/NativeHostManager';

export default defineBackground({
  persistent: true,
  type: 'module',
  async main() {
    chrome.runtime.onConnect.addListener((port) => {
      if (port.name === 'mcp') {
        console.log('[MCP Hub] UI client connected');
        const transport = new ExtensionServerTransport(port);
        const server = new McpServer({ name: 'Extension-Hub', version: '1.0.0' });
        new McpHub(server);
        server.connect(transport);
      }
    });

    initNativeHostListener();

    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'open-sidepanel') {
        chrome.windows.getCurrent((window) => {
          if (window?.id) {
            chrome.sidePanel.open({ windowId: window.id });
          }
        });
      }
    });
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => {
      console.error('[Background] Failed to set side panel behavior:', error);
    });
  },
});
