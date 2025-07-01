import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { type ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface DevtoolsPanelsApiToolsOptions {
  createPanel?: boolean;
  createSidebarPane?: boolean;
  getThemeColor?: boolean;
  openResource?: boolean;
  setOpenResourceHandler?: boolean;
}

export class DevtoolsPanelsApiTools extends BaseApiTools {
  protected apiName = 'Devtools.panels';

  constructor(server: McpServer, options: DevtoolsPanelsApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.devtools?.panels) {
        return {
          available: false,
          message: 'chrome.devtools.panels API is not defined',
          details:
            'This extension needs to be running in a devtools context and have the "devtools" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.devtools.panels.create !== 'function') {
        return {
          available: false,
          message: 'chrome.devtools.panels.create is not available',
          details:
            'The devtools.panels API appears to be partially available. Check manifest permissions and context.',
        };
      }

      return {
        available: true,
        message: 'Devtools.panels API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.devtools.panels API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('createPanel')) {
      this.registerCreatePanel();
    }

    if (this.shouldRegisterTool('createSidebarPane')) {
      this.registerCreateSidebarPane();
    }

    if (this.shouldRegisterTool('getThemeColor')) {
      this.registerGetThemeColor();
    }

    if (this.shouldRegisterTool('openResource')) {
      this.registerOpenResource();
    }

    if (this.shouldRegisterTool('setOpenResourceHandler')) {
      this.registerSetOpenResourceHandler();
    }
  }

  private registerCreatePanel(): void {
    this.server.registerTool(
      'extension_tool_create_panel',
      {
        description: 'Create a new devtools panel with specified title and icon',
        inputSchema: {
          title: z.string().describe('The title of the panel'),
          iconPath: z.string().describe('Path to the icon for the panel'),
          pagePath: z
            .string()
            .describe('Path to the HTML page that will be displayed in the panel'),
        },
      },
      async ({ title, iconPath, pagePath }) => {
        try {
          await new Promise<chrome.devtools.panels.ExtensionPanel>((resolve, reject) => {
            chrome.devtools.panels.create(title, iconPath, pagePath, (panel) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(panel);
              }
            });
          });

          return this.formatSuccess('Panel created successfully', {
            title,
            iconPath,
            pagePath,
            panelCreated: true,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerCreateSidebarPane(): void {
    this.server.registerTool(
      'extension_tool_create_sidebar_pane',
      {
        description: 'Create a sidebar pane in the Elements panel',
        inputSchema: {
          title: z.string().describe('The title of the sidebar pane'),
        },
      },
      async ({ title }) => {
        try {
          await new Promise<chrome.devtools.panels.ExtensionSidebarPane>((resolve, reject) => {
            chrome.devtools.panels.elements.createSidebarPane(title, (sidebarPane) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(sidebarPane);
              }
            });
          });

          return this.formatSuccess('Sidebar pane created successfully', {
            title,
            sidebarPaneCreated: true,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetThemeColor(): void {
    this.server.registerTool(
      'extension_tool_get_theme_color',
      {
        description: 'Get the current theme color of the devtools',
        inputSchema: {},
      },
      async () => {
        try {
          const themeName = chrome.devtools.panels.themeName;

          return this.formatJson({
            themeName,
            description: themeName === 'dark' ? 'Dark theme is active' : 'Light theme is active',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerOpenResource(): void {
    this.server.registerTool(
      'extension_tool_open_resource',
      {
        description: 'Open a resource in the Sources panel',
        inputSchema: {
          url: z.string().describe('URL of the resource to open'),
          lineNumber: z.number().optional().describe('Line number to navigate to (1-based)'),
        },
      },
      async ({ url, lineNumber }) => {
        try {
          await new Promise<void>((resolve, reject) => {
            if (lineNumber !== undefined) {
              chrome.devtools.panels.openResource(url, lineNumber, () => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve();
                }
              });
            } else {
              chrome.devtools.panels.openResource(url, 1, () => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve();
                }
              });
            }
          });

          return this.formatSuccess('Resource opened successfully', {
            url,
            lineNumber: lineNumber || 'not specified',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetOpenResourceHandler(): void {
    this.server.registerTool(
      'extension_tool_set_open_resource_handler',
      {
        description: 'Set a handler for when resources are opened in the devtools',
        inputSchema: {
          enable: z.boolean().describe('Whether to enable or disable the open resource handler'),
        },
      },
      async ({ enable }) => {
        try {
          if (enable) {
            chrome.devtools.panels.setOpenResourceHandler((resource) => {
              console.log('Resource opened:', resource);
              return true; // Indicate that the extension handled the resource
            });

            return this.formatSuccess('Open resource handler enabled', {
              handlerEnabled: true,
            });
          } else {
            chrome.devtools.panels.setOpenResourceHandler(undefined);

            return this.formatSuccess('Open resource handler disabled', {
              handlerEnabled: false,
            });
          }
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
