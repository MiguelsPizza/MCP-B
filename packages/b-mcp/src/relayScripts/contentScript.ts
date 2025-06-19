import { type BridgeMessage, type PageBridgeMessageType } from './uiConnector.js';

/**
 * Sets up a content script bridge that relays messages between the page context
 * and the extension background script. This enables communication between
 * the injected page bridge and the extension's background script.
 *
 * @param port - Optional Chrome runtime port. If not provided, creates a default port with name 'cs'
 * @returns The Chrome runtime port used for communication
 */
export function mcpRelay(port?: chrome.runtime.Port): chrome.runtime.Port {
  // Use provided port or create default connection to background script
  const csPort = port ?? chrome.runtime.connect({ name: 'cs' });

  // Relay messages from page context to extension background
  // Listen for messages from the injected page bridge (pageBridge.js)
  window.addEventListener('message', (e: MessageEvent) => {
    if (e.source === window && e.data?.source === 'EXT-PAGE') {
      console.log('MCP relay: received from tab', e.data.cmd, e.data.clientId);
      const { clientId, msg } = e.data as {
        clientId: string;
        msg: PageBridgeMessageType;
      };
      csPort.postMessage({ clientId, msg });
    }
  });

  // Relay messages from extension background to page context
  // Forward messages from background script to the page bridge
  csPort.onMessage.addListener((data: BridgeMessage) => {
    console.log('MCP relay: received from extension', data.cmd, data.clientId);
    window.postMessage({ source: 'EXT-CS', ...data }, '*');
  });

  return csPort;
}
