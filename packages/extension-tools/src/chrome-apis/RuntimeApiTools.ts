import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface RuntimeApiToolsOptions {
  connect?: boolean;
  connectNative?: boolean;
  getContexts?: boolean;
  getManifest?: boolean;
  getPackageDirectoryEntry?: boolean;
  getPlatformInfo?: boolean;
  getURL?: boolean;
  openOptionsPage?: boolean;
  reload?: boolean;
  requestUpdateCheck?: boolean;
  restart?: boolean;
  restartAfterDelay?: boolean;
  sendMessage?: boolean;
  sendNativeMessage?: boolean;
  setUninstallURL?: boolean;
}

export class RuntimeApiTools extends BaseApiTools {
  protected apiName = 'Runtime';

  constructor(server: McpServer, options: RuntimeApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.runtime) {
        return {
          available: false,
          message: 'chrome.runtime API is not defined',
          details: 'The runtime API should be available in all extension contexts',
        };
      }

      // Test a basic method
      if (typeof chrome.runtime.getManifest !== 'function') {
        return {
          available: false,
          message: 'chrome.runtime.getManifest is not available',
          details: 'The runtime API appears to be partially available.',
        };
      }

      // Try to actually use the API
      const manifest = chrome.runtime.getManifest();
      if (!manifest) {
        throw new Error('Failed to get manifest');
      }

      return {
        available: true,
        message: 'Runtime API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.runtime API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('connect')) {
      this.registerConnect();
    }

    if (this.shouldRegisterTool('connectNative')) {
      this.registerConnectNative();
    }

    if (this.shouldRegisterTool('getContexts')) {
      this.registerGetContexts();
    }

    if (this.shouldRegisterTool('getManifest')) {
      this.registerGetManifest();
    }

    if (this.shouldRegisterTool('getPackageDirectoryEntry')) {
      this.registerGetPackageDirectoryEntry();
    }

    if (this.shouldRegisterTool('getPlatformInfo')) {
      this.registerGetPlatformInfo();
    }

    if (this.shouldRegisterTool('getURL')) {
      this.registerGetURL();
    }

    if (this.shouldRegisterTool('openOptionsPage')) {
      this.registerOpenOptionsPage();
    }

    if (this.shouldRegisterTool('reload')) {
      this.registerReload();
    }

    if (this.shouldRegisterTool('requestUpdateCheck')) {
      this.registerRequestUpdateCheck();
    }

    if (this.shouldRegisterTool('restart')) {
      this.registerRestart();
    }

    if (this.shouldRegisterTool('restartAfterDelay')) {
      this.registerRestartAfterDelay();
    }

    if (this.shouldRegisterTool('sendMessage')) {
      this.registerSendMessage();
    }

    if (this.shouldRegisterTool('sendNativeMessage')) {
      this.registerSendNativeMessage();
    }

    if (this.shouldRegisterTool('setUninstallURL')) {
      this.registerSetUninstallURL();
    }
  }

  private registerConnect(): void {
    this.server.registerTool(
      'runtime_connect',
      {
        description: 'Connect to listeners within an extension or other extensions/apps',
        inputSchema: {
          extensionId: z
            .string()
            .optional()
            .describe(
              'The ID of the extension to connect to. If omitted, connects to your own extension'
            ),
          name: z
            .string()
            .optional()
            .describe(
              'Will be passed into onConnect for processes listening for the connection event'
            ),
          includeTlsChannelId: z
            .boolean()
            .optional()
            .describe('Whether the TLS channel ID will be passed into onConnectExternal'),
        },
      },
      async ({ extensionId, name, includeTlsChannelId }) => {
        try {
          const connectInfo: any = {};
          if (name !== undefined) connectInfo.name = name;
          if (includeTlsChannelId !== undefined)
            connectInfo.includeTlsChannelId = includeTlsChannelId;

          let port: chrome.runtime.Port;
          if (extensionId) {
            port = chrome.runtime.connect(extensionId, connectInfo);
          } else {
            port = chrome.runtime.connect(connectInfo);
          }

          return this.formatSuccess('Connection established successfully', {
            portName: port.name,
            extensionId: extensionId || 'own extension',
            sender: port.sender
              ? {
                  id: port.sender.id,
                  url: port.sender.url,
                  tab: port.sender.tab
                    ? {
                        id: port.sender.tab.id,
                        url: port.sender.tab.url,
                      }
                    : undefined,
                }
              : undefined,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerConnectNative(): void {
    this.server.registerTool(
      'runtime_connect_native',
      {
        description:
          'Connect to a native application in the host machine. Requires "nativeMessaging" permission',
        inputSchema: {
          application: z.string().describe('The name of the registered application to connect to'),
        },
      },
      async ({ application }) => {
        try {
          const port = chrome.runtime.connectNative(application);

          return this.formatSuccess('Native connection established successfully', {
            portName: port.name,
            application: application,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetContexts(): void {
    this.server.registerTool(
      'runtime_get_contexts',
      {
        description: 'Fetch information about active contexts associated with this extension',
        inputSchema: {
          contextTypes: z
            .array(
              z.enum([
                'TAB',
                'POPUP',
                'BACKGROUND',
                'OFFSCREEN_DOCUMENT',
                'SIDE_PANEL',
                'DEVELOPER_TOOLS',
              ])
            )
            .optional()
            .describe('Filter by context types'),
          contextIds: z.array(z.string()).optional().describe('Filter by specific context IDs'),
          tabIds: z.array(z.number()).optional().describe('Filter by tab IDs'),
          windowIds: z.array(z.number()).optional().describe('Filter by window IDs'),
          frameIds: z.array(z.number()).optional().describe('Filter by frame IDs'),
          documentIds: z.array(z.string()).optional().describe('Filter by document IDs'),
          documentUrls: z.array(z.string()).optional().describe('Filter by document URLs'),
          documentOrigins: z.array(z.string()).optional().describe('Filter by document origins'),
          incognito: z.boolean().optional().describe('Filter by incognito status'),
        },
      },
      async ({
        contextTypes,
        contextIds,
        tabIds,
        windowIds,
        frameIds,
        documentIds,
        documentUrls,
        documentOrigins,
        incognito,
      }) => {
        try {
          const filter: any = {};
          if (contextTypes !== undefined) filter.contextTypes = contextTypes;
          if (contextIds !== undefined) filter.contextIds = contextIds;
          if (tabIds !== undefined) filter.tabIds = tabIds;
          if (windowIds !== undefined) filter.windowIds = windowIds;
          if (frameIds !== undefined) filter.frameIds = frameIds;
          if (documentIds !== undefined) filter.documentIds = documentIds;
          if (documentUrls !== undefined) filter.documentUrls = documentUrls;
          if (documentOrigins !== undefined) filter.documentOrigins = documentOrigins;
          if (incognito !== undefined) filter.incognito = incognito;

          const contexts = await new Promise<any[]>((resolve, reject) => {
            chrome.runtime.getContexts(filter, (contexts) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(contexts);
              }
            });
          });

          return this.formatJson({
            count: contexts.length,
            contexts: contexts.map((context) => ({
              contextId: context.contextId,
              contextType: context.contextType,
              documentId: context.documentId,
              documentOrigin: context.documentOrigin,
              documentUrl: context.documentUrl,
              frameId: context.frameId,
              incognito: context.incognito,
              tabId: context.tabId,
              windowId: context.windowId,
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetManifest(): void {
    this.server.registerTool(
      'runtime_get_manifest',
      {
        description: 'Get details about the app or extension from the manifest',
        inputSchema: {},
      },
      async () => {
        try {
          const manifest = chrome.runtime.getManifest();

          return this.formatJson({
            manifest: manifest,
            name: manifest.name,
            version: manifest.version,
            manifestVersion: manifest.manifest_version,
            description: manifest.description,
            permissions: manifest.permissions || [],
            hostPermissions: (manifest as any).host_permissions || [],
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetPackageDirectoryEntry(): void {
    this.server.registerTool(
      'runtime_get_package_directory_entry',
      {
        description: 'Get a DirectoryEntry for the package directory',
        inputSchema: {},
      },
      async () => {
        try {
          const directoryEntry = await new Promise<DirectoryEntry>((resolve, reject) => {
            chrome.runtime.getPackageDirectoryEntry((directoryEntry) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(directoryEntry);
              }
            });
          });

          return this.formatJson({
            name: directoryEntry.name,
            fullPath: directoryEntry.fullPath,
            isDirectory: directoryEntry.isDirectory,
            isFile: directoryEntry.isFile,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetPlatformInfo(): void {
    this.server.registerTool(
      'runtime_get_platform_info',
      {
        description: 'Get information about the current platform',
        inputSchema: {},
      },
      async () => {
        try {
          const platformInfo = await new Promise<chrome.runtime.PlatformInfo>((resolve, reject) => {
            chrome.runtime.getPlatformInfo((platformInfo) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(platformInfo);
              }
            });
          });

          return this.formatJson({
            os: platformInfo.os,
            arch: platformInfo.arch,
            nacl_arch: platformInfo.nacl_arch,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetURL(): void {
    this.server.registerTool(
      'runtime_get_url',
      {
        description:
          'Convert a relative path within an app/extension install directory to a fully-qualified URL',
        inputSchema: {
          path: z
            .string()
            .describe(
              'A path to a resource within an app/extension expressed relative to its install directory'
            ),
        },
      },
      async ({ path }) => {
        try {
          const url = chrome.runtime.getURL(path);

          return this.formatJson({
            relativePath: path,
            fullUrl: url,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerOpenOptionsPage(): void {
    this.server.registerTool(
      'runtime_open_options_page',
      {
        description: "Open the extension's options page",
        inputSchema: {},
      },
      async () => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.runtime.openOptionsPage(() => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Options page opened successfully');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerReload(): void {
    this.server.registerTool(
      'runtime_reload',
      {
        description: 'Reload the app or extension',
        inputSchema: {},
      },
      async () => {
        try {
          chrome.runtime.reload();
          return this.formatSuccess('Extension reload initiated');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerRequestUpdateCheck(): void {
    this.server.registerTool(
      'runtime_request_update_check',
      {
        description: 'Request an immediate update check for this app/extension',
        inputSchema: {},
      },
      async () => {
        try {
          const result = await new Promise<any>((resolve, reject) => {
            chrome.runtime.requestUpdateCheck((result) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(result);
              }
            });
          });

          return this.formatJson({
            status: result.status,
            version: result.version,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerRestart(): void {
    this.server.registerTool(
      'runtime_restart',
      {
        description: 'Restart the ChromeOS device when the app runs in kiosk mode',
        inputSchema: {},
      },
      async () => {
        try {
          chrome.runtime.restart();
          return this.formatSuccess('Device restart initiated (kiosk mode only)');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerRestartAfterDelay(): void {
    this.server.registerTool(
      'runtime_restart_after_delay',
      {
        description: 'Restart the ChromeOS device after a delay when the app runs in kiosk mode',
        inputSchema: {
          seconds: z
            .number()
            .describe(
              'Time to wait in seconds before rebooting the device, or -1 to cancel a scheduled reboot'
            ),
        },
      },
      async ({ seconds }) => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.runtime.restartAfterDelay(seconds, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          if (seconds === -1) {
            return this.formatSuccess('Scheduled restart cancelled');
          } else {
            return this.formatSuccess('Device restart scheduled', { delaySeconds: seconds });
          }
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSendMessage(): void {
    this.server.registerTool(
      'runtime_send_message',
      {
        description:
          'Send a single message to event listeners within your extension or a different extension/app',
        inputSchema: {
          message: z
            .any()
            .describe('The message to send. This message should be a JSON-ifiable object'),
          extensionId: z
            .string()
            .optional()
            .describe(
              'The ID of the extension to send the message to. If omitted, sends to your own extension'
            ),
          includeTlsChannelId: z
            .boolean()
            .optional()
            .describe('Whether the TLS channel ID will be passed into onMessageExternal'),
        },
      },
      async ({ message, extensionId, includeTlsChannelId }) => {
        try {
          const options: any = {};
          if (includeTlsChannelId !== undefined) options.includeTlsChannelId = includeTlsChannelId;

          const response = await new Promise<any>((resolve, reject) => {
            if (extensionId) {
              chrome.runtime.sendMessage(extensionId, message, options, (response) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(response);
                }
              });
            } else {
              chrome.runtime.sendMessage(message, options, (response) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(response);
                }
              });
            }
          });

          return this.formatJson({
            messageSent: message,
            response: response,
            extensionId: extensionId || 'own extension',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSendNativeMessage(): void {
    this.server.registerTool(
      'runtime_send_native_message',
      {
        description:
          'Send a single message to a native application. Requires "nativeMessaging" permission',
        inputSchema: {
          application: z.string().describe('The name of the native messaging host'),
          message: z.any().describe('The message that will be passed to the native messaging host'),
        },
      },
      async ({ application, message }) => {
        try {
          const response = await new Promise<any>((resolve, reject) => {
            chrome.runtime.sendNativeMessage(application, message, (response) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(response);
              }
            });
          });

          return this.formatJson({
            application: application,
            messageSent: message,
            response: response,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetUninstallURL(): void {
    this.server.registerTool(
      'runtime_set_uninstall_url',
      {
        description: 'Set the URL to be visited upon uninstallation. Maximum 1023 characters',
        inputSchema: {
          url: z
            .string()
            .max(1023)
            .describe(
              'URL to be opened after the extension is uninstalled. Must have http: or https: scheme. Set empty string to not open a new tab'
            ),
        },
      },
      async ({ url }) => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.runtime.setUninstallURL(url, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Uninstall URL set successfully', { url: url });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
