import { clientTransport, serverTransport } from './inMemory';
import McpHub from './src/services/mcpHub';
import { initNativeHostListener } from './src/services/oldNativeHost';
export default defineBackground({
  persistent: true,
  type: 'module',
  async main() {
    const hub = new McpHub('Extension');

    const nativeHub = new McpHub('Native', serverTransport);

    nativeHub.connectToBridge();

    initNativeHostListener(clientTransport);
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
