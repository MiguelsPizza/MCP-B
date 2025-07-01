import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { type ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface TabsApiToolsOptions {
  listActiveTabs?: boolean;
  createTab?: boolean;
  updateTab?: boolean;
  closeTabs?: boolean;
  getAllTabs?: boolean;
  navigateHistory?: boolean;
  reloadTab?: boolean;
  captureVisibleTab?: boolean;
  detectLanguage?: boolean;
  discardTab?: boolean;
  duplicateTab?: boolean;
  getTab?: boolean;
  getZoom?: boolean;
  setZoom?: boolean;
  groupTabs?: boolean;
  ungroupTabs?: boolean;
  highlightTabs?: boolean;
  moveTabs?: boolean;
  sendMessage?: boolean;
}

export class TabsApiTools extends BaseApiTools {
  protected apiName = 'Tabs';

  constructor(server: McpServer, options: TabsApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Test basic tabs API access
      if (!chrome.tabs) {
        return {
          available: false,
          message: 'chrome.tabs API is not defined',
          details: 'This extension may not have the "tabs" permission in its manifest',
        };
      }

      // Test a basic method that should always be available with tabs permission
      if (typeof chrome.tabs.query !== 'function') {
        return {
          available: false,
          message: 'chrome.tabs.query is not available',
          details: 'The tabs API appears to be partially available. Check manifest permissions.',
        };
      }

      return {
        available: true,
        message: 'Tabs API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.tabs API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('listActiveTabs')) {
      this.registerListActiveTabs();
    }

    if (this.shouldRegisterTool('createTab')) {
      this.registerCreateTab();
    }

    if (this.shouldRegisterTool('updateTab')) {
      this.registerUpdateTab();
    }

    if (this.shouldRegisterTool('closeTabs')) {
      this.registerCloseTabs();
    }

    if (this.shouldRegisterTool('getAllTabs')) {
      this.registerGetAllTabs();
    }

    // Navigation tools
    if (this.shouldRegisterTool('navigateHistory')) {
      this.checkAndRegisterNavigationTools();
    }

    if (this.shouldRegisterTool('reloadTab')) {
      this.registerReloadTab();
    }

    // Screenshot tool
    if (this.shouldRegisterTool('captureVisibleTab')) {
      this.checkAndRegisterScreenshotTool();
    }

    // New tools
    if (this.shouldRegisterTool('detectLanguage')) {
      this.registerDetectLanguage();
    }

    if (this.shouldRegisterTool('discardTab')) {
      this.registerDiscardTab();
    }

    if (this.shouldRegisterTool('duplicateTab')) {
      this.registerDuplicateTab();
    }

    if (this.shouldRegisterTool('getTab')) {
      this.registerGetTab();
    }

    if (this.shouldRegisterTool('getZoom')) {
      this.registerGetZoom();
      this.registerGetZoomSettings();
    }

    if (this.shouldRegisterTool('setZoom')) {
      this.registerSetZoom();
      this.registerSetZoomSettings();
    }

    if (this.shouldRegisterTool('groupTabs')) {
      this.registerGroupTabs();
    }

    if (this.shouldRegisterTool('ungroupTabs')) {
      this.registerUngroupTabs();
    }

    if (this.shouldRegisterTool('highlightTabs')) {
      this.registerHighlightTabs();
    }

    if (this.shouldRegisterTool('moveTabs')) {
      this.registerMoveTabs();
    }

    if (this.shouldRegisterTool('sendMessage')) {
      this.registerSendMessage();
    }
  }

  private checkAndRegisterNavigationTools(): void {
    try {
      if (typeof chrome.tabs.goBack === 'function' && typeof chrome.tabs.goForward === 'function') {
        this.registerNavigateHistory();
        console.log('  ✓ Navigation methods (goBack/goForward) available');
      } else {
        console.warn('  ✗ Navigation methods not available - Chrome 72+ required');
      }
    } catch {
      console.warn('  ✗ Failed to check navigation methods availability');
    }
  }

  private checkAndRegisterScreenshotTool(): void {
    try {
      if (typeof chrome.tabs.captureVisibleTab === 'function') {
        this.registerCaptureVisibleTab();
        console.log('  ✓ Screenshot capture available');
      } else {
        console.warn(
          '  ✗ Screenshot capture not available - requires "activeTab" or "<all_urls>" permission'
        );
      }
    } catch {
      console.warn('  ✗ Failed to check screenshot capture availability');
    }
  }

  private registerListActiveTabs(): void {
    this.server.registerTool(
      'extension_tool_list_active_tabs',
      {
        description: 'Lists all tabs grouped by domain',
        inputSchema: {},
      },
      async () => {
        const tabs = await chrome.tabs.query({});

        const tabsInfo = tabs.map((tab) => {
          // Extract domain from URL
          let domain = 'unknown';
          if (tab.url) {
            try {
              const url = new URL(tab.url);
              domain = url.hostname;
            } catch {
              // Keep domain as 'unknown' for invalid URLs
            }
          }

          return {
            tabId: tab.id,
            domain,
            url: tab.url,
            title: tab.title,
            isActive: tab.active,
            windowId: tab.windowId,
            index: tab.index,
            pinned: tab.pinned,
            audible: tab.audible,
            mutedInfo: tab.mutedInfo,
            status: tab.status,
          };
        });

        const byDomain = tabsInfo.reduce(
          (acc, tab) => {
            const domain = tab.domain || 'unknown';
            if (!acc[domain]) acc[domain] = [];
            acc[domain].push(tab);
            return acc;
          },
          {} as Record<string, typeof tabsInfo>
        );

        // Sort tabs within each domain by their index
        for (const tabs of Object.values(byDomain)) {
          tabs.sort((a, b) => {
            // First sort by windowId, then by index
            if (a.windowId !== b.windowId) {
              return (a.windowId || 0) - (b.windowId || 0);
            }
            return (a.index || 0) - (b.index || 0);
          });
        }

        return this.formatJson(byDomain);
      }
    );
  }

  private registerCreateTab(): void {
    this.server.registerTool(
      'extension_tool_create_tab',
      {
        description: 'Create a new browser tab',
        inputSchema: {
          url: z
            .string()
            .optional()
            .describe(
              `URL to open in the new tab. Fully-qualified URLs must include a scheme (i.e., 'http://www.google.com', not 'www.google.com'). Relative URLs are relative to the current page within the extension. Defaults to the New Tab Page.`
            ),
          active: z.boolean().optional().describe('Whether the tab should be active'),
          pinned: z.boolean().optional().describe('Whether the tab should be pinned'),
        },
      },
      async ({ url, active, pinned }) => {
        try {
          const tab = await chrome.tabs.create({ url, active, pinned });
          return this.formatSuccess(`Created tab ${tab.id} with URL: ${tab.url || 'about:blank'}`);
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerUpdateTab(): void {
    this.server.registerTool(
      'extension_tool_update_tab',
      {
        description:
          'Update properties of an existing tab. If no tabId is specified, operates on the currently active tab',
        inputSchema: {
          tabId: z.number().optional().describe('ID of the tab to update (defaults to active tab)'),
          url: z.string().optional().describe('New URL for the tab'),
          active: z.boolean().optional().describe('Whether to make the tab active'),
          pinned: z.boolean().optional().describe('Whether to pin/unpin the tab'),
          muted: z.boolean().optional().describe('Whether to mute/unmute the tab'),
        },
      },
      async ({ tabId, url, active, pinned, muted }) => {
        try {
          if (tabId === undefined) {
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!activeTab || !activeTab.id) {
              return this.formatError(new Error('No active tab found'));
            }
            tabId = activeTab.id;
          }

          const updateProperties: chrome.tabs.UpdateProperties = {};
          if (url !== undefined) updateProperties.url = url;
          if (active !== undefined) updateProperties.active = active;
          if (pinned !== undefined) updateProperties.pinned = pinned;
          if (muted !== undefined) updateProperties.muted = muted;

          const tab = await chrome.tabs.update(tabId, updateProperties);
          if (!tab) {
            return this.formatError(new Error('Tab does not exist'));
          }

          return this.formatSuccess(`Updated tab ${tab.id}`, updateProperties);
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerCloseTabs(): void {
    this.server.registerTool(
      'extension_tool_close_tabs',
      {
        description: 'Close one or more tabs',
        inputSchema: {
          tabIds: z.array(z.number()).describe('Array of tab IDs to close'),
        },
      },
      async ({ tabIds }) => {
        try {
          await chrome.tabs.remove(tabIds);
          return this.formatSuccess(`Closed ${tabIds.length} tab(s): ${tabIds.join(', ')}`);
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetAllTabs(): void {
    this.server.registerTool(
      'extension_tool_get_all_tabs',
      {
        description: 'Get information about all open tabs',
        inputSchema: {
          currentWindow: z.boolean().optional().describe('Only get tabs from current window'),
        },
      },
      async ({ currentWindow }) => {
        try {
          const tabs = await chrome.tabs.query(currentWindow ? { currentWindow: true } : {});
          const tabInfo = tabs.map((tab) => ({
            id: tab.id,
            title: tab.title,
            url: tab.url,
            active: tab.active,
            pinned: tab.pinned,
            windowId: tab.windowId,
            index: tab.index,
          }));

          return this.formatJson(tabInfo);
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerNavigateHistory(): void {
    this.server.registerTool(
      'extension_tool_navigate_tab_history',
      {
        description:
          "Navigate forward or backward in a tab's history. If no tabId is specified, operates on the currently active tab",
        inputSchema: {
          tabId: z.number().optional().describe('Tab ID to navigate (defaults to active tab)'),
          direction: z.enum(['back', 'forward']).describe('Navigation direction'),
        },
      },
      async ({ tabId, direction }) => {
        try {
          if (tabId === undefined) {
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!activeTab || !activeTab.id) {
              return this.formatError(new Error('No active tab found'));
            }
            tabId = activeTab.id;
          }

          if (direction === 'back') {
            await chrome.tabs.goBack(tabId);
          } else {
            await chrome.tabs.goForward(tabId);
          }

          return this.formatSuccess(`Navigated ${direction} in tab ${tabId}`);
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerReloadTab(): void {
    this.server.registerTool(
      'extension_tool_reload_tab',
      {
        description: 'Reload a tab. If no tabId is specified, operates on the currently active tab',
        inputSchema: {
          tabId: z.number().optional().describe('Tab ID to reload (defaults to active tab)'),
          bypassCache: z.boolean().optional().describe('Bypass the cache when reloading'),
        },
      },
      async ({ tabId, bypassCache }) => {
        try {
          if (tabId === undefined) {
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!activeTab || !activeTab.id) {
              return this.formatError(new Error('No active tab found'));
            }
            tabId = activeTab.id;
          }

          await chrome.tabs.reload(tabId, { bypassCache });
          return this.formatSuccess(
            `Reloaded tab ${tabId}${bypassCache ? ' (bypassed cache)' : ''}`
          );
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerCaptureVisibleTab(): void {
    this.server.registerTool(
      'extension_tool_capture_visible_tab',
      {
        description:
          'Take a screenshot of the visible area of the currently active tab in a window',
        inputSchema: {
          windowId: z.number().optional().describe('Window ID (defaults to current window)'),
        },
      },
      async ({ windowId }) => {
        try {
          const dataUrl = windowId
            ? await chrome.tabs.captureVisibleTab(windowId, {})
            : await chrome.tabs.captureVisibleTab();

          return this.formatSuccess(
            `Screenshot captured (data URL length: ${dataUrl.length} characters)`
          );
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerDetectLanguage(): void {
    this.server.registerTool(
      'extension_tool_detect_tab_language',
      {
        description: 'Detects the primary language of the content in a tab',
        inputSchema: {
          tabId: z.number().optional().describe('Tab ID (defaults to active tab)'),
        },
      },
      async ({ tabId }) => {
        try {
          const language = await chrome.tabs.detectLanguage(tabId!);
          return this.formatSuccess(`Tab language detected: ${language}`, { language });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerDiscardTab(): void {
    this.server.registerTool(
      'extension_tool_discard_tab',
      {
        description:
          'Discards a tab from memory. Discarded tabs are still visible but need to reload when activated',
        inputSchema: {
          tabId: z
            .number()
            .optional()
            .describe('Tab ID to discard (if omitted, browser picks least important tab)'),
        },
      },
      async ({ tabId }) => {
        try {
          const tab = await chrome.tabs.discard(tabId);
          if (!tab) {
            return this.formatError(new Error('Failed to discard tab'));
          }
          return this.formatSuccess(`Discarded tab ${tab.id}`, { tab });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerDuplicateTab(): void {
    this.server.registerTool(
      'extension_tool_duplicate_tab',
      {
        description: 'Duplicates a tab',
        inputSchema: {
          tabId: z.number().describe('ID of the tab to duplicate'),
        },
      },
      async ({ tabId }) => {
        try {
          const tab = await chrome.tabs.duplicate(tabId);
          if (!tab) {
            return this.formatError(new Error('Failed to duplicate tab'));
          }
          return this.formatSuccess(`Duplicated tab ${tabId} to new tab ${tab.id}`, { tab });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetTab(): void {
    this.server.registerTool(
      'extension_tool_get_tab',
      {
        description: 'Retrieves details about a specific tab',
        inputSchema: {
          tabId: z.number().describe('Tab ID'),
        },
      },
      async ({ tabId }) => {
        try {
          const tab = await chrome.tabs.get(tabId);
          return this.formatJson(tab);
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetZoom(): void {
    this.server.registerTool(
      'extension_tool_get_tab_zoom',
      {
        description: 'Gets the current zoom factor of a tab',
        inputSchema: {
          tabId: z.number().optional().describe('Tab ID (defaults to active tab)'),
        },
      },
      async ({ tabId }) => {
        try {
          const zoomFactor = await chrome.tabs.getZoom(tabId!);
          return this.formatSuccess(`Zoom factor: ${zoomFactor}`, { zoomFactor });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetZoom(): void {
    this.server.registerTool(
      'extension_tool_set_tab_zoom',
      {
        description: 'Sets the zoom factor for a tab',
        inputSchema: {
          tabId: z.number().optional().describe('Tab ID (defaults to active tab)'),
          zoomFactor: z
            .number()
            .describe('New zoom factor (0 resets to default, >0 sets specific zoom)'),
        },
      },
      async ({ tabId, zoomFactor }) => {
        try {
          await chrome.tabs.setZoom(tabId!, zoomFactor);
          return this.formatSuccess(
            `Set zoom factor to ${zoomFactor === 0 ? 'default' : zoomFactor}`
          );
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetZoomSettings(): void {
    this.server.registerTool(
      'extension_tool_get_tab_zoom_settings',
      {
        description: 'Gets the current zoom settings of a tab',
        inputSchema: {
          tabId: z.number().optional().describe('Tab ID (defaults to active tab)'),
        },
      },
      async ({ tabId }) => {
        try {
          const zoomSettings = await chrome.tabs.getZoomSettings(tabId!);
          return this.formatJson(zoomSettings);
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetZoomSettings(): void {
    this.server.registerTool(
      'extension_tool_set_tab_zoom_settings',
      {
        description: 'Sets zoom settings for a tab (how zoom changes are handled)',
        inputSchema: {
          tabId: z.number().optional().describe('Tab ID (defaults to active tab)'),
          mode: z
            .enum(['automatic', 'manual', 'disabled'])
            .optional()
            .describe('How zoom changes are handled'),
          scope: z
            .enum(['per-origin', 'per-tab'])
            .optional()
            .describe('Whether zoom persists across pages'),
        },
      },
      async ({ tabId, mode, scope }) => {
        try {
          const settings: chrome.tabs.ZoomSettings = {};
          if (mode) settings.mode = mode;
          if (scope) settings.scope = scope;

          await chrome.tabs.setZoomSettings(tabId!, settings);
          return this.formatSuccess('Updated zoom settings', settings);
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGroupTabs(): void {
    this.server.registerTool(
      'extension_tool_group_tabs',
      {
        description: 'Groups one or more tabs together',
        inputSchema: {
          tabIds: z.array(z.number()).min(1).describe('Tab IDs to group'),
          groupId: z.number().optional().describe('Existing group ID to add tabs to'),
          createProperties: z
            .object({
              windowId: z.number().optional().describe('Window ID for new group'),
            })
            .optional()
            .describe('Properties for creating a new group'),
        },
      },
      async ({ tabIds, groupId, createProperties }) => {
        try {
          const options: Parameters<typeof chrome.tabs.group>[0] = {
            tabIds: tabIds.length === 1 ? tabIds[0] : tabIds,
          };

          if (groupId !== undefined) {
            options.groupId = groupId;
          } else if (createProperties) {
            options.createProperties = createProperties;
          }

          const resultGroupId = await chrome.tabs.group(options);
          return this.formatSuccess(`Grouped ${tabIds.length} tabs into group ${resultGroupId}`, {
            groupId: resultGroupId,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerUngroupTabs(): void {
    this.server.registerTool(
      'extension_tool_ungroup_tabs',
      {
        description: 'Removes tabs from their groups',
        inputSchema: {
          tabIds: z.array(z.number()).min(1).describe('Tab IDs to ungroup'),
        },
      },
      async ({ tabIds }) => {
        try {
          await chrome.tabs.ungroup(tabIds.length === 1 ? tabIds[0] : tabIds);
          return this.formatSuccess(`Ungrouped ${tabIds.length} tab(s)`);
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerHighlightTabs(): void {
    this.server.registerTool(
      'extension_tool_highlight_tabs',
      {
        description: 'Highlights the given tabs and focuses on the first one',
        inputSchema: {
          tabs: z.array(z.number()).min(1).describe('Tab indices to highlight'),
          windowId: z.number().optional().describe('Window ID containing the tabs'),
        },
      },
      async ({ tabs, windowId }) => {
        try {
          const highlightInfo: chrome.tabs.HighlightInfo = {
            tabs: tabs.length === 1 ? tabs[0] : tabs,
          };
          if (windowId !== undefined) {
            highlightInfo.windowId = windowId;
          }

          const window = await chrome.tabs.highlight(highlightInfo);
          return this.formatSuccess(`Highlighted ${tabs.length} tab(s)`, { window });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerMoveTabs(): void {
    this.server.registerTool(
      'extension_tool_move_tabs',
      {
        description: 'Moves tabs to a new position within their window or to another window',
        inputSchema: {
          tabIds: z.array(z.number()).min(1).describe('Tab IDs to move'),
          index: z.number().describe('Position to move tabs to (-1 for end)'),
          windowId: z.number().optional().describe('Target window ID'),
        },
      },
      async ({ tabIds, index, windowId }) => {
        try {
          const moveProperties: chrome.tabs.MoveProperties = { index };
          if (windowId !== undefined) {
            moveProperties.windowId = windowId;
          }

          const tabs = chrome.tabs.move(
            //@ts-expect-error - to lazy to fix this
            tabIds.length === 1 ? tabIds[0] : tabIds,
            moveProperties
          );
          return this.formatSuccess(`Moved ${tabIds.length} tab(s) to index ${index}`, { tabs });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSendMessage(): void {
    this.server.registerTool(
      'extension_tool_send_message_to_tab',
      {
        description: 'Sends a message to content scripts in a specific tab',
        inputSchema: {
          tabId: z.number().describe('Tab ID to send message to'),
          message: z.any().describe('Message to send (must be JSON-serializable)'),
          frameId: z.number().optional().describe('Specific frame ID to target'),
          documentId: z.string().optional().describe('Specific document ID to target'),
        },
      },
      async ({ tabId, message, frameId, documentId }) => {
        try {
          const options: chrome.tabs.MessageSendOptions = {};
          if (frameId !== undefined) options.frameId = frameId;
          if (documentId !== undefined) options.documentId = documentId;

          const response = await chrome.tabs.sendMessage(tabId, message, options);
          return this.formatSuccess('Message sent successfully', { response });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
