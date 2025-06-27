import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface ManagementApiToolsOptions {
  get?: boolean;
  getAll?: boolean;
  getSelf?: boolean;
  setEnabled?: boolean;
  uninstall?: boolean;
  uninstallSelf?: boolean;
  launchApp?: boolean;
  createAppShortcut?: boolean;
  generateAppForLink?: boolean;
  setLaunchType?: boolean;
  getPermissionWarningsById?: boolean;
  getPermissionWarningsByManifest?: boolean;
}

export class ManagementApiTools extends BaseApiTools {
  protected apiName = 'Management';

  constructor(server: McpServer, options: ManagementApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.management) {
        return {
          available: false,
          message: 'chrome.management API is not defined',
          details: 'This extension needs the "management" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.management.getSelf !== 'function') {
        return {
          available: false,
          message: 'chrome.management.getSelf is not available',
          details:
            'The management API appears to be partially available. Check manifest permissions.',
        };
      }

      // Try to actually use the API
      chrome.management.getSelf((_info) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'Management API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.management API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('get')) {
      this.registerGet();
    }

    if (this.shouldRegisterTool('getAll')) {
      this.registerGetAll();
    }

    if (this.shouldRegisterTool('getSelf')) {
      this.registerGetSelf();
    }

    if (this.shouldRegisterTool('setEnabled')) {
      this.registerSetEnabled();
    }

    if (this.shouldRegisterTool('uninstall')) {
      this.registerUninstall();
    }

    if (this.shouldRegisterTool('uninstallSelf')) {
      this.registerUninstallSelf();
    }

    if (this.shouldRegisterTool('launchApp')) {
      this.registerLaunchApp();
    }

    if (this.shouldRegisterTool('createAppShortcut')) {
      this.registerCreateAppShortcut();
    }

    if (this.shouldRegisterTool('generateAppForLink')) {
      this.registerGenerateAppForLink();
    }

    if (this.shouldRegisterTool('setLaunchType')) {
      this.registerSetLaunchType();
    }

    if (this.shouldRegisterTool('getPermissionWarningsById')) {
      this.registerGetPermissionWarningsById();
    }

    if (this.shouldRegisterTool('getPermissionWarningsByManifest')) {
      this.registerGetPermissionWarningsByManifest();
    }
  }

  private registerGet(): void {
    this.server.registerTool(
      'extension_tool_get_extension',
      {
        description: 'Get information about an installed extension, app, or theme by ID',
        inputSchema: {
          id: z.string().describe('The ID of the extension, app, or theme'),
        },
      },
      async ({ id }) => {
        try {
          const info = await new Promise<chrome.management.ExtensionInfo>((resolve, reject) => {
            chrome.management.get(id, (info) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(info);
              }
            });
          });

          return this.formatJson({
            id: info.id,
            name: info.name,
            shortName: info.shortName,
            description: info.description,
            version: info.version,
            // versionName: info.versionName,
            type: info.type,
            enabled: info.enabled,
            mayDisable: info.mayDisable,
            // mayEnable: info.mayEnable,
            installType: info.installType,
            isApp: info.isApp,
            appLaunchUrl: info.appLaunchUrl,
            homepageUrl: info.homepageUrl,
            updateUrl: info.updateUrl,
            offlineEnabled: info.offlineEnabled,
            optionsUrl: info.optionsUrl,
            permissions: info.permissions,
            hostPermissions: info.hostPermissions,
            disabledReason: info.disabledReason,
            launchType: info.launchType,
            availableLaunchTypes: info.availableLaunchTypes,
            icons: info.icons,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetAll(): void {
    this.server.registerTool(
      'extension_tool_get_all_extensions',
      {
        description: 'Get information about all installed extensions, apps, and themes',
        inputSchema: {},
      },
      async () => {
        try {
          const extensions = await new Promise<chrome.management.ExtensionInfo[]>(
            (resolve, reject) => {
              chrome.management.getAll((extensions) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(extensions);
                }
              });
            }
          );

          return this.formatJson({
            count: extensions.length,
            extensions: extensions.map((info) => ({
              id: info.id,
              name: info.name,
              shortName: info.shortName,
              description: info.description,
              version: info.version,
              // versionName: info.versionName,
              type: info.type,
              enabled: info.enabled,
              mayDisable: info.mayDisable,
              // mayEnable: info.mayEnable,
              installType: info.installType,
              isApp: info.isApp,
              appLaunchUrl: info.appLaunchUrl,
              homepageUrl: info.homepageUrl,
              updateUrl: info.updateUrl,
              offlineEnabled: info.offlineEnabled,
              optionsUrl: info.optionsUrl,
              permissions: info.permissions,
              hostPermissions: info.hostPermissions,
              disabledReason: info.disabledReason,
              launchType: info.launchType,
              availableLaunchTypes: info.availableLaunchTypes,
              icons: info.icons,
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetSelf(): void {
    this.server.registerTool(
      'extension_tool_get_self',
      {
        description: 'Get information about the calling extension, app, or theme',
        inputSchema: {},
      },
      async () => {
        try {
          const info = await new Promise<chrome.management.ExtensionInfo>((resolve, reject) => {
            chrome.management.getSelf((info) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(info);
              }
            });
          });

          return this.formatJson({
            id: info.id,
            name: info.name,
            shortName: info.shortName,
            description: info.description,
            version: info.version,
            // versionName: info.versionName,
            type: info.type,
            enabled: info.enabled,
            mayDisable: info.mayDisable,
            // mayEnable: info.mayEnable,
            installType: info.installType,
            isApp: info.isApp,
            appLaunchUrl: info.appLaunchUrl,
            homepageUrl: info.homepageUrl,
            updateUrl: info.updateUrl,
            offlineEnabled: info.offlineEnabled,
            optionsUrl: info.optionsUrl,
            permissions: info.permissions,
            hostPermissions: info.hostPermissions,
            disabledReason: info.disabledReason,
            launchType: info.launchType,
            availableLaunchTypes: info.availableLaunchTypes,
            icons: info.icons,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetEnabled(): void {
    this.server.registerTool(
      'extension_tool_set_extension_enabled',
      {
        description: 'Enable or disable an extension, app, or theme',
        inputSchema: {
          id: z.string().describe('The ID of the extension, app, or theme'),
          enabled: z.boolean().describe('Whether the extension should be enabled or disabled'),
        },
      },
      async ({ id, enabled }) => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.management.setEnabled(id, enabled, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess(`Extension ${enabled ? 'enabled' : 'disabled'} successfully`, {
            id,
            enabled,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerUninstall(): void {
    this.server.registerTool(
      'extension_tool_uninstall_extension',
      {
        description: 'Uninstall an extension, app, or theme',
        inputSchema: {
          id: z.string().describe('The ID of the extension, app, or theme to uninstall'),
          showConfirmDialog: z
            .boolean()
            .optional()
            .describe('Whether to show a confirmation dialog. Defaults to false'),
        },
      },
      async ({ id, showConfirmDialog }) => {
        try {
          const options: chrome.management.UninstallOptions = {};
          if (showConfirmDialog !== undefined) {
            options.showConfirmDialog = showConfirmDialog;
          }

          await new Promise<void>((resolve, reject) => {
            chrome.management.uninstall(id, options, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Extension uninstalled successfully', { id });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerUninstallSelf(): void {
    this.server.registerTool(
      'extension_tool_uninstall_self',
      {
        description: 'Uninstall the calling extension',
        inputSchema: {
          showConfirmDialog: z
            .boolean()
            .optional()
            .describe('Whether to show a confirmation dialog. Defaults to false'),
        },
      },
      async ({ showConfirmDialog }) => {
        try {
          const options: chrome.management.UninstallOptions = {};
          if (showConfirmDialog !== undefined) {
            options.showConfirmDialog = showConfirmDialog;
          }

          await new Promise<void>((resolve, reject) => {
            chrome.management.uninstallSelf(options, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Extension uninstalled successfully');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerLaunchApp(): void {
    this.server.registerTool(
      'extension_tool_launch_app',
      {
        description: 'Launch an application',
        inputSchema: {
          id: z.string().describe('The extension ID of the application to launch'),
        },
      },
      async ({ id }) => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.management.launchApp(id, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Application launched successfully', { id });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerCreateAppShortcut(): void {
    this.server.registerTool(
      'extension_tool_create_app_shortcut',
      {
        description: 'Create a shortcut for an app',
        inputSchema: {
          id: z.string().describe('The ID of the app to create a shortcut for'),
        },
      },
      async ({ id }) => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.management.createAppShortcut(id, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('App shortcut created successfully', { id });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGenerateAppForLink(): void {
    this.server.registerTool(
      'extension_tool_generate_app_for_link',
      {
        description: 'Generate a bookmark app for a URL',
        inputSchema: {
          url: z.string().url().describe('The URL of the web page. Must use http or https scheme'),
          title: z.string().describe('The title of the generated app'),
        },
      },
      async ({ url, title }) => {
        try {
          const info = await new Promise<chrome.management.ExtensionInfo>((resolve, reject) => {
            chrome.management.generateAppForLink(url, title, (info) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(info);
              }
            });
          });

          return this.formatJson({
            message: 'Bookmark app generated successfully',
            app: {
              id: info.id,
              name: info.name,
              shortName: info.shortName,
              description: info.description,
              version: info.version,
              type: info.type,
              enabled: info.enabled,
              appLaunchUrl: info.appLaunchUrl,
            },
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetLaunchType(): void {
    this.server.registerTool(
      'extension_tool_set_app_launch_type',
      {
        description: 'Set the launch type of an app',
        inputSchema: {
          id: z.string().describe('The ID of the app'),
          launchType: z
            .enum([
              'OPEN_AS_REGULAR_TAB',
              'OPEN_AS_PINNED_TAB',
              'OPEN_AS_WINDOW',
              'OPEN_FULL_SCREEN',
            ])
            .describe('The launch type for the app'),
        },
      },
      async ({ id, launchType }) => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.management.setLaunchType(id, launchType, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('App launch type set successfully', { id, launchType });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetPermissionWarningsById(): void {
    this.server.registerTool(
      'extension_tool_get_permission_warnings_by_id',
      {
        description: 'Get permission warnings for an installed extension by ID',
        inputSchema: {
          id: z.string().describe('The ID of the installed extension'),
        },
      },
      async ({ id }) => {
        try {
          const warnings = await new Promise<string[]>((resolve, reject) => {
            chrome.management.getPermissionWarningsById(id, (warnings) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(warnings);
              }
            });
          });

          return this.formatJson({
            id,
            warningCount: warnings.length,
            warnings,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetPermissionWarningsByManifest(): void {
    this.server.registerTool(
      'extension_tool_get_permission_warnings_by_manifest',
      {
        description: 'Get permission warnings for an extension manifest',
        inputSchema: {
          manifestStr: z.string().describe('Extension manifest JSON string'),
        },
      },
      async ({ manifestStr }) => {
        try {
          const warnings = await new Promise<string[]>((resolve, reject) => {
            chrome.management.getPermissionWarningsByManifest(manifestStr, (warnings) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(warnings);
              }
            });
          });

          return this.formatJson({
            warningCount: warnings.length,
            warnings,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
