import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface TabGroupsApiToolsOptions {
  get?: boolean;
  query?: boolean;
  update?: boolean;
  move?: boolean;
}

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
    if (this.shouldRegisterTool('get')) {
      this.registerGet();
    }

    if (this.shouldRegisterTool('query')) {
      this.registerQuery();
    }

    if (this.shouldRegisterTool('update')) {
      this.registerUpdate();
    }

    if (this.shouldRegisterTool('move')) {
      this.registerMove();
    }
  }

  private registerGet(): void {
    this.server.registerTool(
      'get_tab_group',
      {
        description: 'Get details about a specific tab group',
        inputSchema: {
          groupId: z.number().describe('The ID of the tab group to retrieve'),
        },
      },
      async ({ groupId }) => {
        try {
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
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerQuery(): void {
    this.server.registerTool(
      'query_tab_groups',
      {
        description: 'Search for tab groups that match specified criteria',
        inputSchema: {
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
        },
      },
      async ({ collapsed, color, shared, title, windowId }) => {
        try {
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
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerUpdate(): void {
    this.server.registerTool(
      'update_tab_group',
      {
        description: 'Modify properties of a tab group',
        inputSchema: {
          groupId: z.number().describe('The ID of the group to modify'),
          collapsed: z.boolean().optional().describe('Whether the group should be collapsed'),
          color: z
            .enum(['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'])
            .optional()
            .describe('The color of the group'),
          title: z.string().optional().describe('The title of the group'),
        },
      },
      async ({ groupId, collapsed, color, title }) => {
        try {
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
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerMove(): void {
    this.server.registerTool(
      'move_tab_group',
      {
        description: 'Move a tab group within its window or to a new window',
        inputSchema: {
          groupId: z.number().describe('The ID of the group to move'),
          index: z
            .number()
            .describe('The position to move the group to. Use -1 to place at the end'),
          windowId: z
            .number()
            .optional()
            .describe('The window to move the group to. Defaults to current window'),
        },
      },
      async ({ groupId, index, windowId }) => {
        try {
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
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
