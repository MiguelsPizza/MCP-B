import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { type ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface SidePanelApiToolsOptions {
  getOptions?: boolean;
  setOptions?: boolean;
  getPanelBehavior?: boolean;
  setPanelBehavior?: boolean;
  open?: boolean;
}

export class SidePanelApiTools extends BaseApiTools {
  protected apiName = 'SidePanel';

  constructor(server: McpServer, options: SidePanelApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.sidePanel) {
        return {
          available: false,
          message: 'chrome.sidePanel API is not defined',
          details: 'This extension needs the "sidePanel" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.sidePanel.getOptions !== 'function') {
        return {
          available: false,
          message: 'chrome.sidePanel.getOptions is not available',
          details:
            'The sidePanel API appears to be partially available. Check manifest permissions.',
        };
      }

      // Try to actually use the API
      chrome.sidePanel.getOptions({}, (_options) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'SidePanel API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.sidePanel API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('getOptions')) {
      this.registerGetOptions();
    }

    if (this.shouldRegisterTool('setOptions')) {
      this.registerSetOptions();
    }

    if (this.shouldRegisterTool('getPanelBehavior')) {
      this.registerGetPanelBehavior();
    }

    if (this.shouldRegisterTool('setPanelBehavior')) {
      this.registerSetPanelBehavior();
    }

    if (this.shouldRegisterTool('open')) {
      this.registerOpen();
    }
  }

  private registerGetOptions(): void {
    this.server.registerTool(
      'extension_tool_get_side_panel_options',
      {
        description:
          'Get the active side panel configuration for a specific tab or default settings',
        inputSchema: {
          tabId: z
            .number()
            .optional()
            .describe(
              'If specified, the side panel options for the given tab will be returned. Otherwise, returns the default side panel options'
            ),
        },
      },
      async ({ tabId }) => {
        try {
          const options = await new Promise<chrome.sidePanel.PanelOptions>((resolve, reject) => {
            const getOptions: chrome.sidePanel.GetPanelOptions = {};
            if (tabId !== undefined) {
              getOptions.tabId = tabId;
            }

            chrome.sidePanel.getOptions(getOptions, (options) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(options);
              }
            });
          });

          return this.formatJson({
            tabId: tabId || 'default',
            enabled: options.enabled,
            path: options.path,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetOptions(): void {
    this.server.registerTool(
      'extension_tool_set_side_panel_options',
      {
        description: 'Configure the side panel settings for a specific tab or default behavior',
        inputSchema: {
          enabled: z
            .boolean()
            .optional()
            .describe('Whether the side panel should be enabled. Defaults to true'),
          path: z
            .string()
            .optional()
            .describe(
              'The path to the side panel HTML file to use. Must be a local resource within the extension package'
            ),
          tabId: z
            .number()
            .optional()
            .describe(
              'If specified, the side panel options will only apply to the tab with this id. If omitted, these options set the default behavior'
            ),
        },
      },
      async ({ enabled, path, tabId }) => {
        try {
          const options: chrome.sidePanel.PanelOptions = {};

          if (enabled !== undefined) {
            options.enabled = enabled;
          }

          if (path !== undefined) {
            options.path = path;
          }

          if (tabId !== undefined) {
            options.tabId = tabId;
          }

          await new Promise<void>((resolve, reject) => {
            chrome.sidePanel.setOptions(options, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Side panel options configured successfully', {
            tabId: tabId || 'default',
            enabled: enabled,
            path: path,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetPanelBehavior(): void {
    this.server.registerTool(
      'extension_tool_get_side_panel_behavior',
      {
        description: 'Get the current side panel behavior configuration',
        inputSchema: {},
      },
      async () => {
        try {
          const behavior = await new Promise<chrome.sidePanel.PanelBehavior>((resolve, reject) => {
            chrome.sidePanel.getPanelBehavior((behavior) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(behavior);
              }
            });
          });

          return this.formatJson({
            openPanelOnActionClick: behavior.openPanelOnActionClick,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetPanelBehavior(): void {
    this.server.registerTool(
      'extension_tool_set_side_panel_behavior',
      {
        description:
          'Configure the side panel behavior, such as opening when the action icon is clicked',
        inputSchema: {
          openPanelOnActionClick: z
            .boolean()
            .optional()
            .describe(
              'Whether clicking the extension action icon will toggle showing the extension entry in the side panel. Defaults to false'
            ),
        },
      },
      async ({ openPanelOnActionClick }) => {
        try {
          const behavior: chrome.sidePanel.PanelBehavior = {};

          if (openPanelOnActionClick !== undefined) {
            behavior.openPanelOnActionClick = openPanelOnActionClick;
          }

          await new Promise<void>((resolve, reject) => {
            chrome.sidePanel.setPanelBehavior(behavior, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Side panel behavior configured successfully', {
            openPanelOnActionClick: openPanelOnActionClick,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerOpen(): void {
    this.server.registerTool(
      'extension_tool_open_side_panel',
      {
        description:
          'Open the side panel for the extension. This may only be called in response to a user action',
        inputSchema: {
          tabId: z
            .number()
            .optional()
            .describe(
              'The tab in which to open the side panel. If there is a tab-specific panel, it will only open for that tab. At least one of tabId or windowId must be provided'
            ),
          windowId: z
            .number()
            .optional()
            .describe(
              'The window in which to open the side panel. This is only applicable if the extension has a global side panel or tabId is also specified. At least one of tabId or windowId must be provided'
            ),
        },
      },
      async ({ tabId, windowId }) => {
        try {
          // Validate that at least one context is provided
          if (tabId === undefined && windowId === undefined) {
            return this.formatError(
              'Either tabId or windowId must be specified to open the side panel'
            );
          }

          const options: chrome.sidePanel.OpenOptions = {} as chrome.sidePanel.OpenOptions;

          if (tabId !== undefined) {
            options.tabId = tabId;
          }

          if (windowId !== undefined) {
            options.windowId = windowId;
          }

          await new Promise<void>((resolve, reject) => {
            chrome.sidePanel.open(options, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Side panel opened successfully', {
            tabId: tabId,
            windowId: windowId,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
