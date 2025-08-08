export function initSidepanelHandlers(): void {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'open-sidepanel') {
      chrome.windows.getCurrent((window) => {
        if (!window?.id) return;
        chrome.sidePanel.open({ windowId: window.id });
      });
    }
  });

  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => {
      console.error('[Background] Failed to set side panel behavior:', error);
    });
}

