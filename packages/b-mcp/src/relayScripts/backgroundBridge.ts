import { type BridgeMessage, type BridgeResponse } from './uiConnector.js';

/**
 * In your background script:
 *   import { setupBackgroundBridge } from '@modelcontextprotocol/sdk/extension-bridge/backgroundBridge'
 *   // Dynamically inject pageBridge and contentScript into matching pages
 *   setupBackgroundBridge({
 *     matches: ['https://your-app.com/*'],
 *     pageBridgeRunAt: 'document_start',
 *     contentScriptRunAt: 'document_idle'
 *   });
 */
export async function setupBackgroundBridge(_?: {
  /** Host-match patterns for injection, defaults to ['<all_urls>'] */
  matches?: string[];
  /** When to inject the pageBridge (MAIN world) */
  pageBridgeRunAt?: 'document_start' | 'document_end' | 'document_idle';
  /** When to inject the content script (ISOLATED world) */
  contentScriptRunAt?: 'document_start' | 'document_end' | 'document_idle';
}): Promise<void> {
  // // Dynamically register content scripts if the scripting API is available (MV3+)
  // if (chrome.scripting?.registerContentScripts) {
  //   const matches = options?.matches ?? ['<all_urls>'];
  //   chrome.scripting.registerContentScripts([{
  //     id: 'mcp-page-bridge',
  //     js: ['extension-bridge/pageBridge.js'],
  //     matches,
  //     runAt: options?.pageBridgeRunAt ?? 'document_start',
  //     world: 'MAIN',
  //     persistAcrossSessions: true
  //   }, {
  //     id: 'mcp-content-script',
  //     js: ['extension-bridge/contentScript.js'],
  //     matches,
  //     runAt: options?.contentScriptRunAt ?? 'document_idle',
  //     world: 'ISOLATED',
  //     persistAcrossSessions: true
  //   }]);
  // }
  let uiPort: chrome.runtime.Port | null = null;
  const csPorts = new Map<number, chrome.runtime.Port>();

  // Map client IDs to specific tab IDs to ensure proper routing
  const clientTabMap = new Map<string, number>();

  console.log('BSGW: Background bridge initialized');

  chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'extensionUI') {
      console.log('BSGW: Extension UI connected');
      uiPort = port;

      port.onMessage.addListener((msgFromExtension: BridgeMessage) => {
        console.log('BSGW: Message from extension', msgFromExtension);

        if (msgFromExtension.cmd === 'connect') {
          // For connect commands, we need to pick a tab to connect to
          // For now, use the first available tab, but this could be made smarter
          const firstTabId = Array.from(csPorts.keys())[0];
          if (firstTabId !== undefined) {
            clientTabMap.set(msgFromExtension.clientId, firstTabId);
            const targetPort = csPorts.get(firstTabId);
            if (targetPort) {
              console.log(
                `BSGW: Routing connect for client ${msgFromExtension.clientId} to tab ${firstTabId}`
              );
              targetPort.postMessage(msgFromExtension);
            }
          } else {
            console.error('BSGW: No content script tabs available for connection');
          }
        } else if (msgFromExtension.cmd === 'send') {
          // For send commands, route to the tab that this client is connected to
          const tabId = clientTabMap.get(msgFromExtension.clientId);
          if (tabId !== undefined) {
            const targetPort = csPorts.get(tabId);
            if (targetPort) {
              console.log(
                `BSGW: Routing send for client ${msgFromExtension.clientId} to tab ${tabId}`
              );
              targetPort.postMessage(msgFromExtension);
            } else {
              console.error(
                `BSGW: Tab ${tabId} no longer available for client ${msgFromExtension.clientId}`
              );
              clientTabMap.delete(msgFromExtension.clientId);
            }
          } else {
            console.error(`BSGW: No tab mapping found for client ${msgFromExtension.clientId}`);
          }
        }
      });

      // In backgroundBridge.ts

      port.onDisconnect.addListener(() => {
        console.log('BSGW: Extension UI disconnected');

        // Find all clients that were connected through this UI port
        const disconnectedClientIds = new Set<string>();
        for (const [clientId, _] of clientTabMap.entries()) {
          // This logic assumes one UI port. If you have multiple, you'll need to
          // map UI ports to clients. For now, let's assume one.
          disconnectedClientIds.add(clientId);
        }

        disconnectedClientIds.forEach((clientId) => {
          const tabId = clientTabMap.get(clientId);
          if (tabId !== undefined) {
            const targetPort = csPorts.get(tabId);
            if (targetPort) {
              // Send a new 'disconnect' command to the content script
              console.log(`BSGW: Relaying disconnect for client ${clientId} to tab ${tabId}`);
              targetPort.postMessage({ cmd: 'disconnect', clientId });
            }
          }
          // Clean up the mapping in the background script
          clientTabMap.delete(clientId);
        });

        uiPort = null;
      });
    } else if (port.name === 'cs') {
      const tabId = port.sender?.tab?.id;
      if (typeof tabId === 'number') {
        console.log(`BSGW: Content script connected from tab ${tabId}`);
        csPorts.set(tabId, port);

        port.onMessage.addListener((msgFromTab: BridgeResponse) => {
          console.log(`BSGW: Message from tab ${tabId}`, msgFromTab);

          // Only forward if this response is from the tab we expect for this client
          const expectedTabId = clientTabMap.get(msgFromTab.clientId);
          if (expectedTabId === tabId) {
            uiPort?.postMessage(msgFromTab);
          } else {
            console.warn(
              `BSGW: Ignoring response from tab ${tabId} for client ${msgFromTab.clientId} (expected tab ${expectedTabId})`
            );
          }
        });

        port.onDisconnect.addListener(() => {
          console.log(`BSGW: Content script disconnected from tab ${tabId}`);
          csPorts.delete(tabId);

          // Clean up any client mappings to this tab
          for (const [clientId, mappedTabId] of clientTabMap.entries()) {
            if (mappedTabId === tabId) {
              console.log(`BSGW: Removing client ${clientId} mapping to disconnected tab ${tabId}`);

              // NOTIFY THE UI: Tell the extension UI that the server for this specific
              // client has disappeared.
              if (uiPort) {
                console.log(`BSGW: Notifying UI about disconnected client ${clientId}`);
                uiPort.postMessage({
                  clientId: clientId, // Target the specific client instance
                  msg: {
                    type: 'mcp-server-disconnected',
                    reason: `The tab hosting the server was refreshed or closed.`,
                  },
                });
              }

              clientTabMap.delete(clientId);
            }
          }
        });
      }
    }
  });
}
