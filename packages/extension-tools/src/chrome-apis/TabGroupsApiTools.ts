import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { type ApiAvailability, BaseApiTools } from '../BaseApiTools';
import zodToJsonSchema from 'zod-to-json-schema';

export interface TabGroupsApiToolsOptions {
  get?: boolean;
  query?: boolean;
  update?: boolean;
  move?: boolean;
}

export const TAB_GROUP_ACTIONS = ['get', 'query', 'update', 'move'] as const;

type TabGroupAction = (typeof TAB_GROUP_ACTIONS)[number];

const tabGroupSchema = z.enum(TAB_GROUP_ACTIONS);

export class TabGroupsApiTools extends BaseApiTools {
  protected apiName = 'TabGroups';

  constructor(server: McpServer, options: TabGroupsApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.tabGroups) {
        return {
          available: false,
          message: 'chrome.tabGroups API is not defined',
          details:
            'This extension needs the "tabGroups" permission in its manifest.json and requires Chrome 89+ with Manifest V3',
        };
      }

      // Test a basic method
      if (typeof chrome.tabGroups.query !== 'function') {
        return {
          available: false,
          message: 'chrome.tabGroups.query is not available',
          details:
            'The tabGroups API appears to be partially available. Check manifest permissions.',
        };
      }

      // Try to actually use the API
      chrome.tabGroups.query({}, () => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'TabGroups API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.tabGroups API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    this.server.registerTool(
      'extension_tool_tab_group_operations',
      {
        description: 'Perform operations on tab groups using Chrome TabGroups API',
        inputSchema: {
          action: tabGroupSchema,
          params: z.record(z.any()).optional().describe('Parameters for the chosen action'),
        },
      },
      async ({ action, params = {} }) => {
        try {
          if (!this.shouldRegisterTool(action)) {
            return this.formatError(new Error(`Action "${action}" is not supported`));
          }

          switch (action as TabGroupAction) {
            case 'get':
              return await this.handleGetTabGroup(params);
            case 'query':
              return await this.handleQueryTabGroups(params);
            case 'update':
              return await this.handleUpdateTabGroup(params);
            case 'move':
              return await this.handleMoveTabGroup(params);
            default:
              return this.formatError(new Error(`Action "${action}" is not supported`));
          }
        } catch (error) {
          return this.formatError(error);
        }
      }
    );

    this.server.registerTool(
      'extension_tool_tab_group_parameters_description',
      {
        description:
          'Get the parameters for extension_tool_tab_group_operations tool and the description for the associated action, this tool should be used first before extension_tool_tab_group_operations',
        inputSchema: {
          action: tabGroupSchema,
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
            tool: 'extension_tool_tab_group_operations',
            action,
            note: 'Use the description to double check if the correct action is chosen. Use this JSON Schema for the params field when calling the tool. The top-level tool input is { action, params }.',
          } as const;

          switch (action as TabGroupAction) {
            case 'get': {
              const paramsAndDescription = {
                params: toJson(this.getSchema, 'GetTabGroupParams'),
                description: 'Retrieve a tab group by its ID',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'query': {
              const paramsAndDescription = {
                params: toJson(this.querySchema, 'QueryTabGroupsParams'),
                description: 'Search for tab groups that match specified criteria',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'update': {
              const paramsAndDescription = {
                params: toJson(this.updateSchema, 'UpdateTabGroupParams'),
                description: 'Modify properties of a tab group',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'move': {
              const paramsAndDescription = {
                params: toJson(this.moveSchema, 'MoveTabGroupParams'),
                description: 'Move a tab group within its window or to a new window',
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
  private async handleGetTabGroup(raw: unknown) {
    const { groupId } = this.getSchema.parse(raw);
    const group = await new Promise<chrome.tabGroups.TabGroup>((resolve, reject) => {
      chrome.tabGroups.get(groupId, (group) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(group);
        }
      });
    });

    return this.formatJson({
      id: group.id,
      title: group.title,
      color: group.color,
      collapsed: group.collapsed,
      shared: (group as any).shared,
      windowId: group.windowId,
    });
  }

  private async handleQueryTabGroups(raw: unknown) {
    const { collapsed, color, shared, title, windowId } = this.querySchema.parse(raw);
    // Build query info
    const queryInfo: any = {};

    if (collapsed !== undefined) queryInfo.collapsed = collapsed;
    if (color !== undefined) queryInfo.color = color;
    if (shared !== undefined) queryInfo.shared = shared;
    if (title !== undefined) queryInfo.title = title;
    if (windowId !== undefined) {
      // -2 represents WINDOW_ID_CURRENT in Chrome extensions
      queryInfo.windowId = windowId === -2 ? chrome.windows.WINDOW_ID_CURRENT : windowId;
    }

    const groups = await new Promise<chrome.tabGroups.TabGroup[]>((resolve, reject) => {
      chrome.tabGroups.query(queryInfo, (groups) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(groups);
        }
      });
    });

    return this.formatJson({
      count: groups.length,
      groups: groups.map((group) => ({
        id: group.id,
        title: group.title,
        color: group.color,
        collapsed: group.collapsed,
        shared: (group as any).shared,
        windowId: group.windowId,
      })),
    });
  }

  private async handleUpdateTabGroup(raw: unknown) {
    const { groupId, collapsed, color, title } = this.updateSchema.parse(raw);
    // Build update properties
    const updateProperties: any = {};

    if (collapsed !== undefined) updateProperties.collapsed = collapsed;
    if (color !== undefined) updateProperties.color = color;
    if (title !== undefined) updateProperties.title = title;

    const updatedGroup = await new Promise<chrome.tabGroups.TabGroup | undefined>(
      (resolve, reject) => {
        chrome.tabGroups.update(groupId, updateProperties, (group) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(group);
          }
        });
      }
    );

    if (!updatedGroup) {
      return this.formatError('Failed to update tab group');
    }

    return this.formatSuccess('Tab group updated successfully', {
      id: updatedGroup.id,
      title: updatedGroup.title,
      color: updatedGroup.color,
      collapsed: updatedGroup.collapsed,
      shared: (updatedGroup as any).shared,
      windowId: updatedGroup.windowId,
    });
  }

  private async handleMoveTabGroup(raw: unknown) {
    const { groupId, index, windowId } = this.moveSchema.parse(raw);
    // Build move properties
    const moveProperties: any = {
      index: index,
    };

    if (windowId !== undefined) {
      moveProperties.windowId = windowId;
    }

    const movedGroup = await new Promise<chrome.tabGroups.TabGroup | undefined>(
      (resolve, reject) => {
        chrome.tabGroups.move(groupId, moveProperties, (group) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(group);
          }
        });
      }
    );

    if (!movedGroup) {
      return this.formatError('Failed to move tab group');
    }

    return this.formatSuccess('Tab group moved successfully', {
      id: movedGroup.id,
      title: movedGroup.title,
      color: movedGroup.color,
      collapsed: movedGroup.collapsed,
      shared: (movedGroup as any).shared,
      windowId: movedGroup.windowId,
      newIndex: index,
    });
  }

  // ===== Validation Schemas per action =====
  private getSchema = z.object({
    groupId: z.number().describe('The ID of the tab group to retrieve'),
  });

  private querySchema = z.object({
    collapsed: z.boolean().optional().describe('Whether the groups are collapsed'),
    color: z
      .enum(['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'])
      .optional()
      .describe('The color of the groups'),
    shared: z.boolean().optional().describe('Whether the group is shared (Chrome 137+)'),
    title: z.string().optional().describe('Pattern to match group titles against'),
    windowId: z
      .number()
      .optional()
      .describe('The ID of the parent window, or use -2 for the current window'),
  });

  private updateSchema = z.object({
    groupId: z.number().describe('The ID of the group to modify'),
    collapsed: z.boolean().optional().describe('Whether the group should be collapsed'),
    color: z
      .enum(['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'])
      .optional()
      .describe('The color of the group'),
    title: z.string().optional().describe('The title of the group'),
  });

  private moveSchema = z.object({
    groupId: z.number().describe('The ID of the group to move'),
    index: z.number().describe('The position to move the group to. Use -1 to place at the end'),
    windowId: z
      .number()
      .optional()
      .describe('The window to move the group to. Defaults to current window'),
  });
}
