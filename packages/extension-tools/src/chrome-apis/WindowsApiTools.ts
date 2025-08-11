import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { type ApiAvailability, BaseApiTools } from '../BaseApiTools';
import zodToJsonSchema from 'zod-to-json-schema';

export interface WindowsApiToolsOptions {
  create?: boolean;
  get?: boolean;
  getAll?: boolean;
  getCurrent?: boolean;
  getLastFocused?: boolean;
  remove?: boolean;
  update?: boolean;
}

export const WINDOW_ACTIONS = [
  'create',
  'get',
  'getAll',
  'getCurrent',
  'getLastFocused',
  'remove',
  'update',
] as const;

type WindowAction = (typeof WINDOW_ACTIONS)[number];

const windowActionSchema = z.enum(WINDOW_ACTIONS);

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
    this.server.registerTool(
      'extension_tool_window_operations',
      {
        description: 'Perform operations on browser windows',
        inputSchema: {
          action: windowActionSchema,
          // Parameters vary by action; validated in handler using specific schemas
          params: z.record(z.any()).optional().describe('Parameters for the chosen action'),
        },
      },
      async ({ action, params = {} }) => {
        try {
          if (!this.shouldRegisterTool(action)) {
            return this.formatError(new Error(`Action "${action}" is not supported`));
          }

          switch (action as WindowAction) {
            case 'create':
              return await this.handleCreate(params);
            case 'get':
              return await this.handleGet(params);
            case 'getAll':
              return await this.handleGetAll(params);
            case 'getCurrent':
              return await this.handleGetCurrent(params);
            case 'getLastFocused':
              return await this.handleGetLastFocused(params);
            case 'remove':
              return await this.handleRemove(params);
            case 'update':
              return await this.handleUpdate(params);
            default:
              return this.formatError(`Unknown action: ${String(action)}`);
          }
        } catch (error) {
          return this.formatError(error);
        }
      }
    );

    this.server.registerTool(
      'extension_tool_window_parameters_description',
      {
        description:
          'Get the parameters for extension_tool_window_operations tool and the description for the associated action, this tool should be used first before extension_tool_window_operations',
        inputSchema: {
          action: windowActionSchema,
        },
      },
      async ({ action }) => {
        try {
          // Build JSON Schema for the params of the requested action so an LLM can construct a valid call
          const toJson = (schema: z.ZodTypeAny, name: string) =>
            zodToJsonSchema(schema, { name, $refStrategy: 'none' });

          const payloadBase = {
            tool: 'extension_tool_window_operations',
            action,
            note: 'Use the description to double check if the correct action is chosen. Use this JSON Schema for the params field when calling the tool. The top-level tool input is { action, params }.',
          } as const;

          switch (action as WindowAction) {
            case 'create': {
              const paramsAndDescription = {
                params: toJson(this.createSchema, 'CreateWindowSchema'),
                description:
                  'Create a new browser window with optional sizing, position, or default URL',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'get': {
              const paramsAndDescription = {
                params: toJson(this.getSchema, 'GetWindowSchema'),
                description: 'Get details about a specific window',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'getAll': {
              const paramsAndDescription = {
                params: toJson(this.getAllSchema, 'GetAllWindowsSchema'),
                description: 'Get all browser windows',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'getCurrent': {
              const paramsAndDescription = {
                params: toJson(this.getCurrentSchema, 'GetCurrentWindowSchema'),
                description: 'Get the current window',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'getLastFocused': {
              const paramsAndDescription = {
                params: toJson(this.getLastFocusedSchema, 'GetLastFocusedWindowSchema'),
                description: 'Get the window that was most recently focused',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'remove': {
              const paramAndDescription = {
                params: toJson(this.removeSchema, 'RemoveWindowSchema'),
                description: 'Remove (close) a window and all the tabs inside it',
              };
              return this.formatJson({ ...payloadBase, ...paramAndDescription });
            }
            case 'update': {
              const paramsAndDescription = {
                params: toJson(this.updateSchema, 'UpdateWindowSchema'),
                description: 'Update the properties of a window',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            default: {
              return this.formatError(`Unknown action: ${String(action)}`);
            }
          }
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  // ===== Validation Schemas per action =====
  private createSchema = z.object({
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
      .describe('The number of pixels to position the new window from the left edge of the screen'),
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
      .describe('The number of pixels to position the new window from the top edge of the screen'),
    type: z
      .enum(['normal', 'popup', 'panel'])
      .optional()
      .describe('Specifies what type of browser window to create'),
    width: z
      .number()
      .optional()
      .describe('The width in pixels of the new window, including the frame'),
  });

  private getSchema = z.object({
    windowId: z.number().describe('The ID of the window to get'),
    populate: z
      .boolean()
      .optional()
      .describe('If true, the window object will include a tabs property with tab details'),
    windowTypes: z
      .array(z.enum(['normal', 'popup', 'panel', 'app', 'devtools']))
      .optional()
      .describe('Filter the window based on its type'),
  });

  private getAllSchema = z.object({
    populate: z
      .boolean()
      .optional()
      .describe('If true, each window object will include a tabs property with tab details'),
    windowTypes: z
      .array(z.enum(['normal', 'popup', 'panel', 'app', 'devtools']))
      .optional()
      .describe('Filter windows based on their type'),
  });

  private getCurrentSchema = z.object({
    populate: z
      .boolean()
      .optional()
      .describe('If true, the window object will include a tabs property with tab details'),
    windowTypes: z
      .array(z.enum(['normal', 'popup', 'panel', 'app', 'devtools']))
      .optional()
      .describe('Filter the window based on its type'),
  });

  private getLastFocusedSchema = z.object({
    populate: z
      .boolean()
      .optional()
      .describe('If true, the window object will include a tabs property with tab details'),
    windowTypes: z
      .array(z.enum(['normal', 'popup', 'panel', 'app', 'devtools']))
      .optional()
      .describe('Filter the window based on its type'),
  });

  private removeSchema = z.object({
    windowId: z.number().describe('The ID of the window to remove'),
  });

  private updateSchema = z.object({
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
      .describe('The offset from the left edge of the screen to move the window to in pixels'),
    state: z
      .enum(['normal', 'minimized', 'maximized', 'fullscreen', 'locked-fullscreen'])
      .optional()
      .describe('The new state of the window'),
    top: z
      .number()
      .optional()
      .describe('The offset from the top edge of the screen to move the window to in pixels'),
    width: z.number().optional().describe('The width to resize the window to in pixels'),
  });

  // ===== Action handlers =====
  private async handleCreate(raw: unknown) {
    const {
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
    } = this.createSchema.parse(raw);
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
  }

  private async handleGet(raw: unknown) {
    const { windowId, populate, windowTypes } = this.getSchema.parse(raw);
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
  }

  private async handleGetAll(raw: unknown) {
    const { populate, windowTypes } = this.getAllSchema.parse(raw);
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
  }

  private async handleGetCurrent(raw: unknown) {
    const { populate, windowTypes } = this.getCurrentSchema.parse(raw);
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
  }

  private async handleGetLastFocused(raw: unknown) {
    const { populate, windowTypes } = this.getLastFocusedSchema.parse(raw);
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
  }

  private async handleRemove(raw: unknown) {
    const { windowId } = this.removeSchema.parse(raw);
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
  }

  private async handleUpdate(raw: unknown) {
    const { windowId, drawAttention, focused, height, left, state, top, width } =
      this.updateSchema.parse(raw);
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
  }
}
