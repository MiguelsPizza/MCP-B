import { ExtensionServerTransport } from '@mcp-b/transports';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import McpHub from './src/services/mcpHub';
import { initNativeHostListener } from './src/services/NativeHostManager';
import { ConsentManager } from './src/services/ConsentManager';

export default defineBackground({
  persistent: true,
  type: 'module',
  async main() {
    const server = new McpServer({ name: 'Extension-Hub', version: '1.0.0' });
    const mcpHub = new McpHub(server);

    chrome.runtime.onConnect.addListener((port) => {
      if (port.name === 'mcp') {
        console.log('[MCP Hub] UI client connected');
        const transport = new ExtensionServerTransport(port);
        server.connect(transport);
      }
    });

    initNativeHostListener();

    chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
      if (message.action === 'open-sidepanel') {
        chrome.windows.getCurrent((window) => {
          if (window?.id) {
            chrome.sidePanel.open({ windowId: window.id });
          }
        });
        return;
      }

      if (message.type === 'request-consent') {
        console.log(`[Background] Consent request for domain: ${message.domain}`);

        // Extract domain from URL for consent check
        const domain = message.domain;
        const tabId = sender.tab?.id;

        if (!tabId) {
          console.error('[Background] No tab ID available for consent request');
          return;
        }

        try {
          // Check if we already have consent
          const hasExistingConsent = await ConsentManager.hasConsent(domain);
          if (hasExistingConsent) {
            console.log(`[Background] Existing consent found for domain: ${domain}`);
            chrome.tabs.sendMessage(tabId, {
              type: 'consent-response',
              messageId: message.messageId,
              granted: true,
            });
            return;
          }

          // Request new consent
          const granted = await ConsentManager.requestConsent(domain, tabId, message.url);
          console.log(
            `[Background] Consent ${granted ? 'granted' : 'denied'} for domain: ${domain}`
          );

          // Notify UI that consent was updated with detailed information
          chrome.runtime
            .sendMessage({
              type: 'consent-updated',
              domain: domain,
              granted: granted,
              isNewDecision: true,
            })
            .catch(() => {
              // Ignore errors - UI might not be open
            });

          // Send response back to content script
          chrome.tabs.sendMessage(tabId, {
            type: 'consent-response',
            messageId: message.messageId,
            granted,
          });
        } catch (error) {
          console.error('[Background] Error handling consent request:', error);
          chrome.tabs.sendMessage(tabId, {
            type: 'consent-response',
            messageId: message.messageId,
            granted: false,
          });
        }
        return;
      }

      if (message.type === 'remove-consent') {
        console.log(`[Background] Removing consent for domain: ${message.domain}`);
        try {
          await ConsentManager.removeConsent(message.domain);
          // Directly disconnect servers
          mcpHub.disconnectDomainServers(message.domain);

          // Notify UI that consent was updated
          chrome.runtime.sendMessage({ type: 'consent-updated' }).catch(() => {
            // Ignore errors - UI might not be open
          });
        } catch (error) {
          console.error('[Background] Error removing consent:', error);
        }
        return;
      }

      if (message.type === 'clear-all-consent') {
        console.log('[Background] Clearing all consent decisions');
        try {
          const decisions = await ConsentManager.getConsentDecisions();
          const grantedDomains = Object.keys(decisions).filter(
            (domain) => decisions[domain].granted
          );

          await ConsentManager.clearAllConsent();

          // Disconnect servers for all granted domains
          for (const domain of grantedDomains) {
            mcpHub.disconnectDomainServers(domain);
          }

          // Notify UI that consent was updated
          chrome.runtime.sendMessage({ type: 'consent-updated' }).catch(() => {
            // Ignore errors - UI might not be open
          });
        } catch (error) {
          console.error('[Background] Error clearing all consent:', error);
        }
        return;
      }
    });

    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => {
      console.error('[Background] Failed to set side panel behavior:', error);
    });
  },
});
