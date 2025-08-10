import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BGSWRouter } from './src/routers';
import McpHub from './src/services/mcpHub';
import { initNativeHostListener } from './src/services/NativeHostManager';
import { initExternalExtensionPortListener } from './src/services/ports/ExternalExtensionPortManager';
import { initUiClientPortListener } from './src/services/ports/UiClientPortManager';
import { initSidepanelHandlers } from './src/services/sidepanel';
import { createChromeHandler } from './trpc-browser/adapter';

function isUserScriptsAvailable() {
  try {
    // Throws if API permission or toggle is not enabled.
    chrome.userScripts.getScripts();
    return true;
  } catch {
    console.log('User scripts are not available');
    return false;
  }
}

function configureUserScriptWorldMaxAccess() {
  if (!isUserScriptsAvailable()) return;

  const permissiveCsp = [
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: filesystem: http: https:",
    "object-src 'self' blob: data:",
    'connect-src * data: blob:',
    'img-src * data: blob:',
    "style-src * 'unsafe-inline' blob: data:",
    'font-src * data: blob:',
    'frame-src * data: blob:',
  ].join('; ');

  // Configure default USER_SCRIPT world
  try {
    chrome.userScripts.configureWorld({
      messaging: true,
      csp: permissiveCsp,
    });
  } catch (error) {
    console.warn('Failed to configure default USER_SCRIPT world:', error);
  }

  // Also configure a named world with the same permissive settings for callers that use worldId
  try {
    chrome.userScripts.configureWorld({
      messaging: true,
      csp: permissiveCsp,
      // Use a stable non-reserved world ID for maximum-access world
      worldId: 'max',
    });
  } catch (error) {
    console.warn('Failed to configure USER_SCRIPT world "max":', error);
  }

  try {
    chrome.userScripts.getWorldConfigurations((worlds) => {
      console.log('Configured user script worlds:', worlds);
    });
  } catch (error) {
    console.warn('Failed to get user script world configurations:', error);
  }
}

export default defineBackground({
  persistent: true,

  type: 'module',
  main() {
    // initWebMCPInjector(); // This will be great in the future. not needed atm
    configureUserScriptWorldMaxAccess();
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

    // Initialize WebMCP polyfill injection (runs very early in tabs)

    // Native host and sidepanel behavior
    initNativeHostListener();
    initSidepanelHandlers();

    // Re-apply world configuration after install/update since user scripts are cleared on update
    // chrome.runtime.onInstalled.addListener((details) => {
    //   if (details.reason === 'install' || details.reason === 'update') {
    configureUserScriptWorldMaxAccess();
    //   }
    // });
    if (isUserScriptsAvailable()) {
      createChromeHandler({
        router: BGSWRouter,
        chrome: chrome,
      });
    }
  },
});
