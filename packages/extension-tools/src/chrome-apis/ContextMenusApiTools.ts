import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface ContextMenusApiToolsOptions {
  createContextMenu?: boolean;
  updateContextMenu?: boolean;
  removeContextMenu?: boolean;
  removeAllContextMenus?: boolean;
}

export class ContextMenusApiTools extends BaseApiTools {
  protected apiName = 'ContextMenus';

  constructor(server: McpServer, options: ContextMenusApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.contextMenus) {
        return {
          available: false,
          message: 'chrome.contextMenus API is not defined',
          details: 'This extension needs the "contextMenus" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.contextMenus.create !== 'function') {
        return {
          available: false,
          message: 'chrome.contextMenus.create is not available',
          details:
            'The contextMenus API appears to be partially available. Check manifest permissions.',
        };
      }

      // Try to actually use the API
      try {
        chrome.contextMenus.removeAll(() => {
          if (chrome.runtime.lastError) {
            throw new Error(chrome.runtime.lastError.message);
          }
        });
      } catch (error) {
        // This is expected in some contexts, but we can still use the API
      }

      return {
        available: true,
        message: 'ContextMenus API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.contextMenus API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('createContextMenu')) {
      this.registerCreateContextMenu();
    }

    if (this.shouldRegisterTool('updateContextMenu')) {
      this.registerUpdateContextMenu();
    }

    if (this.shouldRegisterTool('removeContextMenu')) {
      this.registerRemoveContextMenu();
    }

    if (this.shouldRegisterTool('removeAllContextMenus')) {
      this.registerRemoveAllContextMenus();
    }
  }

  private registerCreateContextMenu(): void {
    this.server.registerTool(
      'extension_tool_create_context_menu',
      {
        description: 'Create a new context menu item that appears when right-clicking on web pages',
        inputSchema: {
          id: z
            .string()
            .optional()
            .describe('Unique ID for this menu item. If not provided, one will be generated'),
          title: z
            .string()
            .optional()
            .describe(
              'Text to display in the menu item. Required unless type is separator. Use %s to show selected text'
            ),
          type: z
            .enum(['normal', 'checkbox', 'radio', 'separator'])
            .optional()
            .describe('Type of menu item. Defaults to normal'),
          contexts: z
            .array(
              z.enum([
                'all',
                'page',
                'frame',
                'selection',
                'link',
                'editable',
                'image',
                'video',
                'audio',
                'launcher',
                'browser_action',
                'page_action',
                'action',
              ])
            )
            .optional()
            .describe('Contexts where this menu item appears. Defaults to [page]'),
          checked: z.boolean().optional().describe('Initial state for checkbox or radio items'),
          enabled: z
            .boolean()
            .optional()
            .describe('Whether the menu item is enabled. Defaults to true'),
          visible: z
            .boolean()
            .optional()
            .describe('Whether the menu item is visible. Defaults to true'),
          parentId: z
            .union([z.string(), z.number()])
            .optional()
            .describe('ID of parent menu item to create a submenu'),
          documentUrlPatterns: z
            .array(z.string())
            .optional()
            .describe('URL patterns where this item should appear'),
          targetUrlPatterns: z
            .array(z.string())
            .optional()
            .describe('URL patterns for link/media targets'),
        },
      },
      async ({
        id,
        title,
        type,
        contexts,
        checked,
        enabled,
        visible,
        parentId,
        documentUrlPatterns,
        targetUrlPatterns,
      }) => {
        try {
          // Validate required fields
          if (type !== 'separator' && !title) {
            return this.formatError('Title is required unless type is separator');
          }

          // Build create properties
          const createProperties: chrome.contextMenus.CreateProperties = {};

          if (id !== undefined) createProperties.id = id;
          if (title !== undefined) createProperties.title = title;
          if (type !== undefined) createProperties.type = type;
          // @ts-expect-error - TODO: fix this
          if (contexts !== undefined) createProperties.contexts = contexts;
          if (checked !== undefined) createProperties.checked = checked;
          if (enabled !== undefined) createProperties.enabled = enabled;
          if (visible !== undefined) createProperties.visible = visible;
          if (parentId !== undefined) createProperties.parentId = parentId;
          if (documentUrlPatterns !== undefined)
            createProperties.documentUrlPatterns = documentUrlPatterns;
          if (targetUrlPatterns !== undefined)
            createProperties.targetUrlPatterns = targetUrlPatterns;

          // Create the context menu item
          const menuItemId = await new Promise<string | number>((resolve, reject) => {
            const createdId = chrome.contextMenus.create(createProperties, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(createdId);
              }
            });
          });

          return this.formatSuccess('Context menu item created successfully', {
            id: menuItemId,
            title: title || '(separator)',
            type: type || 'normal',
            contexts: contexts || ['page'],
            enabled: enabled !== false,
            visible: visible !== false,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerUpdateContextMenu(): void {
    this.server.registerTool(
      'extension_tool_update_context_menu',
      {
        description: 'Update an existing context menu item',
        inputSchema: {
          id: z.union([z.string(), z.number()]).describe('ID of the menu item to update'),
          title: z.string().optional().describe('New title for the menu item'),
          type: z
            .enum(['normal', 'checkbox', 'radio', 'separator'])
            .optional()
            .describe('New type for the menu item'),
          contexts: z
            .array(
              z.enum([
                'all',
                'page',
                'frame',
                'selection',
                'link',
                'editable',
                'image',
                'video',
                'audio',
                'launcher',
                'browser_action',
                'page_action',
                'action',
              ])
            )
            .optional()
            .describe('New contexts for the menu item'),
          checked: z.boolean().optional().describe('New checked state for checkbox or radio items'),
          enabled: z.boolean().optional().describe('Whether the menu item should be enabled'),
          visible: z.boolean().optional().describe('Whether the menu item should be visible'),
          parentId: z
            .union([z.string(), z.number()])
            .optional()
            .describe('New parent ID for the menu item'),
          documentUrlPatterns: z.array(z.string()).optional().describe('New document URL patterns'),
          targetUrlPatterns: z.array(z.string()).optional().describe('New target URL patterns'),
        },
      },
      async ({
        id,
        title,
        type,
        contexts,
        checked,
        enabled,
        visible,
        parentId,
        documentUrlPatterns,
        targetUrlPatterns,
      }) => {
        try {
          // Build update properties
          const updateProperties: any = {};

          if (title !== undefined) updateProperties.title = title;
          if (type !== undefined) updateProperties.type = type;
          if (contexts !== undefined) updateProperties.contexts = contexts;
          if (checked !== undefined) updateProperties.checked = checked;
          if (enabled !== undefined) updateProperties.enabled = enabled;
          if (visible !== undefined) updateProperties.visible = visible;
          if (parentId !== undefined) updateProperties.parentId = parentId;
          if (documentUrlPatterns !== undefined)
            updateProperties.documentUrlPatterns = documentUrlPatterns;
          if (targetUrlPatterns !== undefined)
            updateProperties.targetUrlPatterns = targetUrlPatterns;

          // Update the context menu item
          await new Promise<void>((resolve, reject) => {
            chrome.contextMenus.update(id, updateProperties, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Context menu item updated successfully', {
            id,
            updatedProperties: Object.keys(updateProperties),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerRemoveContextMenu(): void {
    this.server.registerTool(
      'extension_tool_remove_context_menu',
      {
        description: 'Remove a specific context menu item',
        inputSchema: {
          id: z.union([z.string(), z.number()]).describe('ID of the menu item to remove'),
        },
      },
      async ({ id }) => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.contextMenus.remove(id, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Context menu item removed successfully', { id });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerRemoveAllContextMenus(): void {
    this.server.registerTool(
      'extension_tool_remove_all_context_menus',
      {
        description: 'Remove all context menu items created by this extension',
        inputSchema: {},
      },
      async () => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.contextMenus.removeAll(() => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('All context menu items removed successfully');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
