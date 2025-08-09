// Service to inject WebMCP polyfill into tabs early using chrome.scripting API

// Function to inject the polyfill into a tab
async function injectWebMCPPolyfill(tabId: number) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: false }, // Only inject in main frame
      world: 'MAIN', // Run in the main world, not isolated
      injectImmediately: true, // Inject as early as possible
      files: ['polyfill.js'] // File from public directory
    });
  } catch (error) {
    // This may fail for certain tabs (chrome:// pages, etc), which is expected
    console.debug(`[WebMCP Injector] Could not inject into tab ${tabId}:`, error);
  }
}

// Initialize the WebMCP injector
export function initWebMCPInjector() {
  // Inject into all existing tabs on startup
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (tab.id && tab.url && !tab.url.startsWith('chrome://')) {
        injectWebMCPPolyfill(tab.id);
      }
    }
  });

  // Listen for new tabs being created
  chrome.tabs.onCreated.addListener((tab) => {
    if (tab.id) {
      console.log('injecting into tab', tab.id);
      injectWebMCPPolyfill(tab.id);
    }
  });

  // Listen for tab updates (navigation)
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Inject when a page starts loading
    if (changeInfo.status === 'loading' && tab.url && !tab.url.startsWith('chrome://')) {
      injectWebMCPPolyfill(tabId);
    }
  });

  // Also listen for navigation events for more reliable injection
  // chrome.webNavigation.onCommitted.addListener((details) => {
  //   // Only inject in main frames, not subframes
  //   if (details.frameId === 0 && !details.url.startsWith('chrome://')) {
  //     injectWebMCPPolyfill(details.tabId);
  //   }
  // });

  console.log('[WebMCP Injector] Initialized WebMCP polyfill injector');
}