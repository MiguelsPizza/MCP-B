import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { type ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface WindowsApiToolsOptions {
  create?: boolean;
  get?: boolean;
  getAll?: boolean;
  getCurrent?: boolean;
  getLastFocused?: boolean;
  remove?: boolean;
  update?: boolean;
}

export class WindowsApiTools extends BaseApiTools {
  protected apiName = 'Windows';

  constructor(server: McpServer, options: WindowsApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.windows) {
        return {
          available: false,
          message: 'chrome.windows API is not defined',
          details: 'This extension needs the "windows" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.windows.getAll !== 'function') {
        return {
          available: false,
          message: 'chrome.windows.getAll is not available',
          details: 'The windows API appears to be partially available. Check manifest permissions.',
        };
      }

      // Try to actually use the API
      chrome.windows.getAll((_windows) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'Windows API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.windows API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('create')) {
      this.registerCreate();
    }

    if (this.shouldRegisterTool('get')) {
      this.registerGet();
    }

    if (this.shouldRegisterTool('getAll')) {
      this.registerGetAll();
    }

    if (this.shouldRegisterTool('getCurrent')) {
      this.registerGetCurrent();
    }

    if (this.shouldRegisterTool('getLastFocused')) {
      this.registerGetLastFocused();
    }

    if (this.shouldRegisterTool('remove')) {
      this.registerRemove();
    }

    if (this.shouldRegisterTool('update')) {
      this.registerUpdate();
    }
  }

  private registerCreate(): void {
    this.server.registerTool(
      'extension_tool_create_window',
      {
        description: 'Create a new browser window with optional sizing, position, or default URL',
        inputSchema: {
          url: z
            .union([z.string(), z.array(z.string())])
            .optional()
            .describe('A URL or array of URLs to open as tabs in the window'),
          focused: z
            .boolean()
            .optional()
            .describe('If true, opens an active window. If false, opens an inactive window'),
          height: z
            .number()
            .optional()
            .describe('The height in pixels of the new window, including the frame'),
          incognito: z
            .boolean()
            .optional()
            .describe('Whether the new window should be an incognito window'),
          left: z
            .number()
            .optional()
            .describe(
              'The number of pixels to position the new window from the left edge of the screen'
            ),
          setSelfAsOpener: z
            .boolean()
            .optional()
            .describe("If true, the newly-created window's 'window.opener' is set to the caller"),
          state: z
            .enum(['normal', 'minimized', 'maximized', 'fullscreen', 'locked-fullscreen'])
            .optional()
            .describe('The initial state of the window'),
          tabId: z.number().optional().describe('The ID of the tab to add to the new window'),
          top: z
            .number()
            .optional()
            .describe(
              'The number of pixels to position the new window from the top edge of the screen'
            ),
          type: z
            .enum(['normal', 'popup', 'panel'])
            .optional()
            .describe('Specifies what type of browser window to create'),
          width: z
            .number()
            .optional()
            .describe('The width in pixels of the new window, including the frame'),
        },
      },
      async ({
        url,
        focused,
        height,
        incognito,
        left,
        setSelfAsOpener,
        state,
        tabId,
        top,
        type,
        width,
      }) => {
        try {
          const createData: chrome.windows.CreateData = {};

          if (url !== undefined) createData.url = url;
          if (focused !== undefined) createData.focused = focused;
          if (height !== undefined) createData.height = height;
          if (incognito !== undefined) createData.incognito = incognito;
          if (left !== undefined) createData.left = left;
          if (setSelfAsOpener !== undefined) createData.setSelfAsOpener = setSelfAsOpener;
          if (state !== undefined) createData.state = state;
          if (tabId !== undefined) createData.tabId = tabId;
          if (top !== undefined) createData.top = top;
          if (type !== undefined) createData.type = type;
          if (width !== undefined) createData.width = width;

          const window = await new Promise<chrome.windows.Window>((resolve, reject) => {
            chrome.windows.create(createData, (window) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(window!);
              }
            });
          });

          return this.formatJson({
            id: window.id,
            focused: window.focused,
            incognito: window.incognito,
            alwaysOnTop: window.alwaysOnTop,
            state: window.state,
            type: window.type,
            left: window.left,
            top: window.top,
            width: window.width,
            height: window.height,
            tabs: window.tabs?.map((tab) => ({
              id: tab.id,
              url: tab.url,
              title: tab.title,
              active: tab.active,
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGet(): void {
    this.server.registerTool(
      'extension_tool_get_window',
      {
        description: 'Get details about a specific window',
        inputSchema: {
          windowId: z.number().describe('The ID of the window to get'),
          populate: z
            .boolean()
            .optional()
            .describe('If true, the window object will include a tabs property with tab details'),
          windowTypes: z
            .array(z.enum(['normal', 'popup', 'panel', 'app', 'devtools']))
            .optional()
            .describe('Filter the window based on its type'),
        },
      },
      async ({ windowId, populate, windowTypes }) => {
        try {
          const queryOptions: chrome.windows.QueryOptions = {};
          if (populate !== undefined) queryOptions.populate = populate;
          if (windowTypes !== undefined) queryOptions.windowTypes = windowTypes;

          const window = await new Promise<chrome.windows.Window>((resolve, reject) => {
            chrome.windows.get(windowId, queryOptions, (window) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(window);
              }
            });
          });

          return this.formatJson({
            id: window.id,
            focused: window.focused,
            incognito: window.incognito,
            alwaysOnTop: window.alwaysOnTop,
            state: window.state,
            type: window.type,
            left: window.left,
            top: window.top,
            width: window.width,
            height: window.height,
            sessionId: window.sessionId,
            tabs: window.tabs?.map((tab) => ({
              id: tab.id,
              url: tab.url,
              title: tab.title,
              active: tab.active,
              index: tab.index,
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetAll(): void {
    this.server.registerTool(
      'extension_tool_get_all_windows',
      {
        description: 'Get all browser windows',
        inputSchema: {
          populate: z
            .boolean()
            .optional()
            .describe('If true, each window object will include a tabs property with tab details'),
          windowTypes: z
            .array(z.enum(['normal', 'popup', 'panel', 'app', 'devtools']))
            .optional()
            .describe('Filter windows based on their type'),
        },
      },
      async ({ populate, windowTypes }) => {
        try {
          const queryOptions: chrome.windows.QueryOptions = {};
          if (populate !== undefined) queryOptions.populate = populate;
          if (windowTypes !== undefined) queryOptions.windowTypes = windowTypes;

          const windows = await new Promise<chrome.windows.Window[]>((resolve, reject) => {
            chrome.windows.getAll(queryOptions, (windows) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(windows);
              }
            });
          });

          return this.formatJson({
            count: windows.length,
            windows: windows.map((window) => ({
              id: window.id,
              focused: window.focused,
              incognito: window.incognito,
              alwaysOnTop: window.alwaysOnTop,
              state: window.state,
              type: window.type,
              left: window.left,
              top: window.top,
              width: window.width,
              height: window.height,
              sessionId: window.sessionId,
              tabs: window.tabs?.map((tab) => ({
                id: tab.id,
                url: tab.url,
                title: tab.title,
                active: tab.active,
                index: tab.index,
              })),
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetCurrent(): void {
    this.server.registerTool(
      'extension_tool_get_current_window',
      {
        description: 'Get the current window',
        inputSchema: {
          populate: z
            .boolean()
            .optional()
            .describe('If true, the window object will include a tabs property with tab details'),
          windowTypes: z
            .array(z.enum(['normal', 'popup', 'panel', 'app', 'devtools']))
            .optional()
            .describe('Filter the window based on its type'),
        },
      },
      async ({ populate, windowTypes }) => {
        try {
          const queryOptions: chrome.windows.QueryOptions = {};
          if (populate !== undefined) queryOptions.populate = populate;
          if (windowTypes !== undefined) queryOptions.windowTypes = windowTypes;

          const window = await new Promise<chrome.windows.Window>((resolve, reject) => {
            chrome.windows.getCurrent(queryOptions, (window) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(window);
              }
            });
          });

          return this.formatJson({
            id: window.id,
            focused: window.focused,
            incognito: window.incognito,
            alwaysOnTop: window.alwaysOnTop,
            state: window.state,
            type: window.type,
            left: window.left,
            top: window.top,
            width: window.width,
            height: window.height,
            sessionId: window.sessionId,
            tabs: window.tabs?.map((tab) => ({
              id: tab.id,
              url: tab.url,
              title: tab.title,
              active: tab.active,
              index: tab.index,
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetLastFocused(): void {
    this.server.registerTool(
      'extension_tool_get_last_focused_window',
      {
        description: 'Get the window that was most recently focused',
        inputSchema: {
          populate: z
            .boolean()
            .optional()
            .describe('If true, the window object will include a tabs property with tab details'),
          windowTypes: z
            .array(z.enum(['normal', 'popup', 'panel', 'app', 'devtools']))
            .optional()
            .describe('Filter the window based on its type'),
        },
      },
      async ({ populate, windowTypes }) => {
        try {
          const queryOptions: chrome.windows.QueryOptions = {};
          if (populate !== undefined) queryOptions.populate = populate;
          if (windowTypes !== undefined) queryOptions.windowTypes = windowTypes;

          const window = await new Promise<chrome.windows.Window>((resolve, reject) => {
            chrome.windows.getLastFocused(queryOptions, (window) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(window);
              }
            });
          });

          return this.formatJson({
            id: window.id,
            focused: window.focused,
            incognito: window.incognito,
            alwaysOnTop: window.alwaysOnTop,
            state: window.state,
            type: window.type,
            left: window.left,
            top: window.top,
            width: window.width,
            height: window.height,
            sessionId: window.sessionId,
            tabs: window.tabs?.map((tab) => ({
              id: tab.id,
              url: tab.url,
              title: tab.title,
              active: tab.active,
              index: tab.index,
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerRemove(): void {
    this.server.registerTool(
      'extension_tool_remove_window',
      {
        description: 'Remove (close) a window and all the tabs inside it',
        inputSchema: {
          windowId: z.number().describe('The ID of the window to remove'),
        },
      },
      async ({ windowId }) => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.windows.remove(windowId, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Window removed successfully', { windowId });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerUpdate(): void {
    this.server.registerTool(
      'extension_tool_update_window',
      {
        description: 'Update the properties of a window',
        inputSchema: {
          windowId: z.number().describe('The ID of the window to update'),
          drawAttention: z
            .boolean()
            .optional()
            .describe(
              "If true, causes the window to be displayed in a manner that draws the user's attention"
            ),
          focused: z.boolean().optional().describe('If true, brings the window to the front'),
          height: z.number().optional().describe('The height to resize the window to in pixels'),
          left: z
            .number()
            .optional()
            .describe(
              'The offset from the left edge of the screen to move the window to in pixels'
            ),
          state: z
            .enum(['normal', 'minimized', 'maximized', 'fullscreen', 'locked-fullscreen'])
            .optional()
            .describe('The new state of the window'),
          top: z
            .number()
            .optional()
            .describe('The offset from the top edge of the screen to move the window to in pixels'),
          width: z.number().optional().describe('The width to resize the window to in pixels'),
        },
      },
      async ({ windowId, drawAttention, focused, height, left, state, top, width }) => {
        try {
          const updateInfo: chrome.windows.UpdateInfo = {};

          if (drawAttention !== undefined) updateInfo.drawAttention = drawAttention;
          if (focused !== undefined) updateInfo.focused = focused;
          if (height !== undefined) updateInfo.height = height;
          if (left !== undefined) updateInfo.left = left;
          if (state !== undefined) updateInfo.state = state;
          if (top !== undefined) updateInfo.top = top;
          if (width !== undefined) updateInfo.width = width;

          const window = await new Promise<chrome.windows.Window>((resolve, reject) => {
            chrome.windows.update(windowId, updateInfo, (window) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(window);
              }
            });
          });

          return this.formatJson({
            id: window.id,
            focused: window.focused,
            incognito: window.incognito,
            alwaysOnTop: window.alwaysOnTop,
            state: window.state,
            type: window.type,
            left: window.left,
            top: window.top,
            width: window.width,
            height: window.height,
            sessionId: window.sessionId,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
