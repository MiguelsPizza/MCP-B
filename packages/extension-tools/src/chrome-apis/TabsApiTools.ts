import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { type ApiAvailability, BaseApiTools } from '../BaseApiTools';
import zodToJsonSchema from 'zod-to-json-schema';

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

export const TAB_ACTIONS = [
  'listActiveTabs',
  'createTab',
  'updateTab',
  'closeTabs',
  'getAllTabs',
  'navigateHistory',
  'reloadTab',
  'captureVisibleTab',
  'detectLanguage',
  'discardTab',
  'duplicateTab',
  'getTab',
  'getZoom',
  'getZoomSettings',
  'setZoom',
  'setZoomSettings',
  'groupTabs',
  'ungroupTabs',
  'highlightTabs',
  'moveTabs',
  'sendMessage',
] as const;

type TabAction = (typeof TAB_ACTIONS)[number];

const tabActionSchema = z.enum(TAB_ACTIONS);

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
    this.server.registerTool(
      'extension_tool_tab_operations',
      {
        description: 'Perform various tab operations using the Chrome Tabs API',
        inputSchema: {
          action: tabActionSchema,
          params: z.record(z.any()).optional().describe('Parameters for the chosen action'),
        },
      },
      async ({ action, params = {} }) => {
        try {
          if (!this.shouldRegisterTool(action)) {
            return this.formatError(new Error(`Action "${action}" is not supported`));
          }

          switch (action as TabAction) {
            case 'listActiveTabs':
              return await this.handleListActiveTabs();
            case 'createTab':
              return await this.handleCreateTab(params);
            case 'updateTab':
              return await this.handleUpdateTab(params);
            case 'closeTabs':
              return await this.handleCloseTabs(params);
            case 'getAllTabs':
              return await this.handleGetAllTabs(params);
            case 'navigateHistory':
              return await this.handleNavigateHistory(params);
            case 'reloadTab':
              return await this.handleReloadTab(params);
            case 'captureVisibleTab':
              return await this.handleCaptureVisibleTab(params);
            case 'detectLanguage':
              return await this.handleDetectLanguage(params);
            case 'discardTab':
              return await this.handleDiscardTab(params);
            case 'duplicateTab':
              return await this.handleDuplicateTab(params);
            case 'getTab':
              return await this.handleGetTab(params);
            case 'getZoom':
              return await this.handleGetZoom(params);
            case 'getZoomSettings':
              return await this.handleGetZoomSettings(params);
            case 'setZoom':
              return await this.handleSetZoom(params);
            case 'setZoomSettings':
              return await this.handleSetZoomSettings(params);
            case 'groupTabs':
              return await this.handleGroupTabs(params);
            case 'ungroupTabs':
              return await this.handleUngroupTabs(params);
            case 'highlightTabs':
              return await this.handleHighlightTabs(params);
            case 'moveTabs':
              return await this.handleMoveTabs(params);
            case 'sendMessage':
              return await this.handleSendMessage(params);
            default:
              return this.formatError(new Error(`Action "${action}" is not supported`));
          }
        } catch (error) {
          return this.formatError(error);
        }
      }
    );

    this.server.registerTool(
      'extension_tool_tab_parameters_description',
      {
        description:
          'Get the parameters for extension_tool_tab_operations tool and the description for the associated action, this tool should be used first before extension_tool_tab_operations',
        inputSchema: {
          action: tabActionSchema,
        },
      },
      async ({ action }) => {
        try {
          if (!this.shouldRegisterTool(action)) {
            return this.formatError(new Error(`Action "${action}" is not supported`));
          }

          const toJson = (schema: z.ZodTypeAny, name: string) =>
            zodToJsonSchema(schema, { name, $refStrategy: 'none' });

          const payloadBase = {
            tool: 'extension_tool_tab_operations',
            action,
            note: 'Use the description to double check if the correct action is chosen. Use this JSON Schema for the params field when calling the tool. The top-level tool input is { action, params }.',
          } as const;

          switch (action as TabAction) {
            case 'listActiveTabs': {
              const paramsAndDescription = {
                params: toJson(this.listActiveTabsSchema, 'ListActiveTabsParams'),
                description: 'Lists all tabs grouped by domain',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'createTab': {
              const paramsAndDescription = {
                params: toJson(this.createTabSchema, 'CreateTabParams'),
                description: 'Create a new browser tab',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'updateTab': {
              const paramsAndDescription = {
                params: toJson(this.updateTabSchema, 'UpdateTabParams'),
                description:
                  'Update properties of an existing tab. If no tabId is specified, operates on the currently active tab',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'closeTabs': {
              const paramsAndDescription = {
                params: toJson(this.closeTabsSchema, 'CloseTabsParams'),
                description: 'Close one or more tabs',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'getAllTabs': {
              const paramsAndDescription = {
                params: toJson(this.getAllTabsSchema, 'GetAllTabsParams'),
                description: 'Get information about all open tabs',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'navigateHistory': {
              const paramsAndDescription = {
                params: toJson(this.navigateHistorySchema, 'NavigateHistoryParams'),
                description:
                  "Navigate forward or backward in a tab's history. If no tabId is specified, operates on the currently active tab",
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'reloadTab': {
              const paramsAndDescription = {
                params: toJson(this.reloadTabSchema, 'ReloadTabParams'),
                description:
                  'Reload a tab. If no tabId is specified, operates on the currently active tab',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'captureVisibleTab': {
              const paramsAndDescription = {
                params: toJson(this.captureVisibleTabSchema, 'CaptureVisibleTabParams'),
                description:
                  'Take a screenshot of the visible area of the currently active tab in a window. Once the screenshot is captured',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'detectLanguage': {
              const paramsAndDescription = {
                params: toJson(this.detectLanguageSchema, 'DetectLanguageParams'),
                description: 'Detect the primary language of the content in a tab',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'discardTab': {
              const paramsAndDescription = {
                params: toJson(this.discardTabSchema, 'DiscardTabParams'),
                description:
                  'Discards a tab from memory. Discarded tabs are still visible but need to reload when activated',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'duplicateTab': {
              const paramsAndDescription = {
                params: toJson(this.duplicateTabSchema, 'DuplicateTabParams'),
                description: 'Duplicate a tab',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'getTab': {
              const paramsAndDescription = {
                params: toJson(this.getTabSchema, 'GetTabParams'),
                description: 'Retrieves details about a specific tab',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'getZoom': {
              const paramsAndDescription = {
                params: toJson(this.getZoomSchema, 'GetZoomParams'),
                description: 'Retrieves the current zoom level of a tab',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'getZoomSettings': {
              const paramsAndDescription = {
                params: toJson(this.getZoomSettingsSchema, 'GetZoomSettingsParams'),
                description: 'Gets the current zoom settings of a tab',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'setZoom': {
              const paramsAndDescription = {
                params: toJson(this.setZoomSchema, 'SetZoomParams'),
                description: 'Sets the zoom factor of a tab',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'setZoomSettings': {
              const paramsAndDescription = {
                params: toJson(this.setZoomSettingsSchema, 'SetZoomSettingsParams'),
                description: 'Sets zoom settings for a tab (how zoom changes are handled)',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'groupTabs': {
              const paramsAndDescription = {
                params: toJson(this.groupTabsSchema, 'GroupTabsParams'),
                description: 'Groups one or more tabs together',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'ungroupTabs': {
              const paramsAndDescription = {
                params: toJson(this.ungroupTabsSchema, 'UngroupTabsParams'),
                description: 'Removes tabs from their groups',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'highlightTabs': {
              const paramsAndDescription = {
                params: toJson(this.highlightTabsSchema, 'HighlightTabsParams'),
                description: 'Highlights the given tabs and focuses on the first one',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'moveTabs': {
              const paramsAndDescription = {
                params: toJson(this.moveTabsSchema, 'MoveTabsParams'),
                description:
                  'Moves tabs to a new position within their window or to another window',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'sendMessage': {
              const paramsAndDescription = {
                params: toJson(this.sendMessageSchema, 'SendMessageParams'),
                description: 'Sends a message to content scripts in a specific tab',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            default:
              return this.formatError(new Error(`Action "${action}" is not supported`));
          }
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  // ===== Action handlers =====
  private async handleListActiveTabs() {
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

  private async handleCreateTab(raw: unknown) {
    const { url, active, pinned } = this.createTabSchema.parse(raw);
    const tab = await chrome.tabs.create({ url, active, pinned });
    return this.formatSuccess(`Created tab ${tab.id} with URL: ${tab.url || 'about:blank'}`);
  }

  private async handleUpdateTab(raw: unknown) {
    let { tabId, url, active, pinned, muted } = this.updateTabSchema.parse(raw);
    if (tabId === undefined) {
      const [activeTab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
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
  }

  private async handleCloseTabs(raw: unknown) {
    const { tabIds } = this.closeTabsSchema.parse(raw);
    await chrome.tabs.remove(tabIds);
    return this.formatSuccess(`Closed ${tabIds.length} tab(s): ${tabIds.join(', ')}`);
  }

  private async handleGetAllTabs(raw: unknown) {
    const { currentWindow } = this.getAllTabsSchema.parse(raw);
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
  }

  private async handleNavigateHistory(raw: unknown) {
    if (typeof chrome.tabs.goBack !== 'function' || typeof chrome.tabs.goForward !== 'function') {
      return this.formatError(
        new Error('✗ Navigation methods not available - Chrome 72+ required')
      );
    }
    let { tabId, direction } = this.navigateHistorySchema.parse(raw);
    if (tabId === undefined) {
      const [activeTab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
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
  }

  private async handleReloadTab(raw: unknown) {
    let { tabId, bypassCache } = this.reloadTabSchema.parse(raw);
    if (tabId === undefined) {
      const [activeTab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!activeTab || !activeTab.id) {
        return this.formatError(new Error('No active tab found'));
      }
      tabId = activeTab.id;
    }

    await chrome.tabs.reload(tabId, { bypassCache });
    return this.formatSuccess(`Reloaded tab ${tabId}${bypassCache ? ' (bypassed cache)' : ''}`);
  }

  private async handleCaptureVisibleTab(raw: unknown) {
    if (typeof chrome.tabs.captureVisibleTab !== 'function') {
      return this.formatError(
        new Error(
          '✗ Screenshot capture not available - requires "activeTab" or "<all_urls>" permission'
        )
      );
    }
    const { windowId } = this.captureVisibleTabSchema.parse(raw);
    const dataUrl = windowId
      ? await chrome.tabs.captureVisibleTab(windowId, {})
      : await chrome.tabs.captureVisibleTab();

    chrome.tabs.create({ url: dataUrl });
    return this.formatSuccess(
      `Screenshot captured (data URL length: ${dataUrl.length} characters)`
    );
  }

  private async handleDetectLanguage(raw: unknown) {
    const { tabId } = this.detectLanguageSchema.parse(raw);
    const language = await chrome.tabs.detectLanguage(tabId!);
    return this.formatSuccess(`Tab language detected: ${language}`, {
      language,
    });
  }

  private async handleDiscardTab(raw: unknown) {
    const { tabId } = this.discardTabSchema.parse(raw);
    const tab = await chrome.tabs.discard(tabId);
    if (!tab) {
      return this.formatError(new Error('Failed to discard tab'));
    }
    return this.formatSuccess(`Discarded tab ${tab.id}`, { tab });
  }

  private async handleDuplicateTab(raw: unknown) {
    const { tabId } = this.duplicateTabSchema.parse(raw);
    const tab = await chrome.tabs.duplicate(tabId);
    if (!tab) {
      return this.formatError(new Error('Failed to duplicate tab'));
    }
    return this.formatSuccess(`Duplicated tab ${tab.id}`, { tab });
  }

  private async handleGetTab(raw: unknown) {
    const { tabId } = this.getTabSchema.parse(raw);
    const tab = await chrome.tabs.get(tabId);
    return this.formatJson(tab);
  }

  private async handleGetZoom(raw: unknown) {
    const { tabId } = this.getZoomSchema.parse(raw);
    const zoomFactor = await chrome.tabs.getZoom(tabId!);
    return this.formatSuccess(`Zoom factor: ${zoomFactor}`, {
      zoomFactor,
    });
  }

  private async handleGetZoomSettings(raw: unknown) {
    const { tabId } = this.getZoomSettingsSchema.parse(raw);
    const zoomSettings = await chrome.tabs.getZoomSettings(tabId!);
    return this.formatJson(zoomSettings);
  }

  private async handleSetZoom(raw: unknown) {
    const { tabId, zoomFactor } = this.setZoomSchema.parse(raw);
    await chrome.tabs.setZoom(tabId!, zoomFactor);
    return this.formatSuccess(`Set zoom factor to ${zoomFactor === 0 ? 'default' : zoomFactor}`);
  }

  private async handleSetZoomSettings(raw: unknown) {
    const { tabId, mode, scope } = this.setZoomSettingsSchema.parse(raw);
    const settings: chrome.tabs.ZoomSettings = {};
    if (mode) settings.mode = mode;
    if (scope) settings.scope = scope;

    await chrome.tabs.setZoomSettings(tabId!, settings);
    return this.formatSuccess('Updated zoom settings', settings);
  }

  private async handleGroupTabs(raw: unknown) {
    const { tabIds, groupId, createProperties } = this.groupTabsSchema.parse(raw);
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
  }

  private async handleUngroupTabs(raw: unknown) {
    const { tabIds } = this.ungroupTabsSchema.parse(raw);
    await chrome.tabs.ungroup(tabIds.length === 1 ? tabIds[0] : tabIds);
    return this.formatSuccess(`Ungrouped ${tabIds.length} tab(s)`);
  }

  private async handleHighlightTabs(raw: unknown) {
    const { tabs, windowId } = this.highlightTabsSchema.parse(raw);
    const highlightInfo: chrome.tabs.HighlightInfo = {
      tabs: tabs.length === 1 ? tabs[0] : tabs,
    };
    if (windowId !== undefined) {
      highlightInfo.windowId = windowId;
    }

    const window = await chrome.tabs.highlight(highlightInfo);
    return this.formatSuccess(`Highlighted ${tabs.length} tab(s)`, {
      window,
    });
  }

  private async handleMoveTabs(raw: unknown) {
    const { tabIds, index, windowId } = this.moveTabsSchema.parse(raw);
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
  }

  private async handleSendMessage(raw: unknown) {
    const { tabId, message, frameId, documentId } = this.sendMessageSchema.parse(raw);
    const options: chrome.tabs.MessageSendOptions = {};
    if (frameId !== undefined) options.frameId = frameId;
    if (documentId !== undefined) options.documentId = documentId;

    const response = await chrome.tabs.sendMessage(tabId, message, options);
    return this.formatSuccess('Message sent successfully', { response });
  }

  // ===== Validation Schemas per action =====
  private listActiveTabsSchema = z.object({});

  private createTabSchema = z.object({
    url: z
      .string()
      .optional()
      .describe(
        `URL to open in the new tab. Fully-qualified URLs must include a scheme (i.e., 'http://www.google.com', not 'www.google.com'). Relative URLs are relative to the current page within the extension. Defaults to the New Tab Page.`
      ),
    active: z.boolean().optional().describe('Whether the tab should be active'),
    pinned: z.boolean().optional().describe('Whether the tab should be pinned'),
  });

  private updateTabSchema = z.object({
    tabId: z.number().optional().describe('ID of the tab to update (defaults to active tab)'),
    url: z.string().optional().describe('New URL for the tab'),
    active: z.boolean().optional().describe('Whether to make the tab active'),
    pinned: z.boolean().optional().describe('Whether to pin/unpin the tab'),
    muted: z.boolean().optional().describe('Whether to mute/unmute the tab'),
  });

  private closeTabsSchema = z.object({
    tabIds: z.array(z.number()).describe('Array of tab IDs to close'),
  });

  private getAllTabsSchema = z.object({
    currentWindow: z.boolean().optional().describe('Only get tabs from current window'),
  });

  private navigateHistorySchema = z.object({
    tabId: z.number().optional().describe('Tab ID to navigate (defaults to active tab)'),
    direction: z.enum(['back', 'forward']).describe('Navigation direction'),
  });

  private reloadTabSchema = z.object({
    tabId: z.number().optional().describe('Tab ID to reload (defaults to active tab)'),
    bypassCache: z.boolean().optional().describe('Bypass the cache when reloading'),
  });

  private captureVisibleTabSchema = z.object({
    windowId: z.number().optional().describe('Window ID (defaults to current window)'),
  });

  private detectLanguageSchema = z.object({
    tabId: z.number().optional().describe('Tab ID (defaults to active tab)'),
  });

  private discardTabSchema = z.object({
    tabId: z
      .number()
      .optional()
      .describe('Tab ID to discard (if omitted, browser picks least important tab)'),
  });

  private duplicateTabSchema = z.object({
    tabId: z.number().describe('ID of the tab to duplicate'),
  });

  private getTabSchema = z.object({
    tabId: z.number().describe('Tab ID'),
  });

  private getZoomSchema = z.object({
    tabId: z.number().optional().describe('Tab ID (defaults to active tab)'),
  });

  private getZoomSettingsSchema = z.object({
    tabId: z.number().optional().describe('Tab ID (defaults to active tab)'),
  });

  private setZoomSchema = z.object({
    tabId: z.number().optional().describe('Tab ID (defaults to active tab)'),
    zoomFactor: z.number().describe('New zoom factor (0 resets to default, >0 sets specific zoom)'),
  });

  private setZoomSettingsSchema = z.object({
    tabId: z.number().optional().describe('Tab ID (defaults to active tab)'),
    mode: z
      .enum(['automatic', 'manual', 'disabled'])
      .optional()
      .describe('How zoom changes are handled'),
    scope: z
      .enum(['per-origin', 'per-tab'])
      .optional()
      .describe('Whether zoom persists across pages'),
  });

  private groupTabsSchema = z.object({
    tabIds: z.array(z.number()).min(1).describe('Tab IDs to group'),
    groupId: z.number().optional().describe('Existing group ID to add tabs to'),
    createProperties: z
      .object({
        windowId: z.number().optional().describe('Window ID for new group'),
      })
      .optional()
      .describe('Properties for creating a new group'),
  });

  private ungroupTabsSchema = z.object({
    tabIds: z.array(z.number()).min(1).describe('Tab IDs to ungroup'),
  });

  private highlightTabsSchema = z.object({
    tabs: z.array(z.number()).min(1).describe('Tab indices to highlight'),
    windowId: z.number().optional().describe('Window ID containing the tabs'),
  });

  private moveTabsSchema = z.object({
    tabIds: z.array(z.number()).min(1).describe('Tab IDs to move'),
    index: z.number().describe('Position to move tabs to (-1 for end)'),
    windowId: z.number().optional().describe('Target window ID'),
  });

  private sendMessageSchema = z.object({
    tabId: z.number().describe('Tab ID to send message to'),
    message: z.any().describe('Message to send (must be JSON-serializable)'),
    frameId: z.number().optional().describe('Specific frame ID to target'),
    documentId: z.string().optional().describe('Specific document ID to target'),
  });
}
