import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { type ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface FileSystemProviderApiToolsOptions {
  mount?: boolean;
  unmount?: boolean;
  get?: boolean;
  getAll?: boolean;
  notify?: boolean;
}

export class FileSystemProviderApiTools extends BaseApiTools {
  protected apiName = 'FileSystemProvider';

  constructor(server: McpServer, options: FileSystemProviderApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.fileSystemProvider) {
        return {
          available: false,
          message: 'chrome.fileSystemProvider API is not defined',
          details:
            'This extension needs the "fileSystemProvider" permission in its manifest.json and is only available on ChromeOS',
        };
      }

      // Test a basic method
      if (typeof chrome.fileSystemProvider.getAll !== 'function') {
        return {
          available: false,
          message: 'chrome.fileSystemProvider.getAll is not available',
          details:
            'The fileSystemProvider API appears to be partially available. Check manifest permissions and ensure running on ChromeOS.',
        };
      }

      // Try to actually use the API
      chrome.fileSystemProvider.getAll((_fileSystems) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'FileSystemProvider API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.fileSystemProvider API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('mount')) {
      this.registerMount();
    }

    if (this.shouldRegisterTool('unmount')) {
      this.registerUnmount();
    }

    if (this.shouldRegisterTool('get')) {
      this.registerGet();
    }

    if (this.shouldRegisterTool('getAll')) {
      this.registerGetAll();
    }

    if (this.shouldRegisterTool('notify')) {
      this.registerNotify();
    }
  }

  private registerMount(): void {
    this.server.registerTool(
      'extension_tool_mount_file_system',
      {
        description: 'Mount a file system with the given fileSystemId and displayName',
        inputSchema: {
          fileSystemId: z
            .string()
            .describe(
              'The string identifier of the file system. Must be unique per each extension'
            ),
          displayName: z.string().describe('A human-readable name for the file system'),
          writable: z
            .boolean()
            .optional()
            .describe('Whether the file system supports operations which may change contents'),
          openedFilesLimit: z
            .number()
            .optional()
            .describe(
              'The maximum number of files that can be opened at once. If not specified, or 0, then not limited'
            ),
          supportsNotifyTag: z
            .boolean()
            .optional()
            .describe('Whether the file system supports the tag field for observed directories'),
          persistent: z
            .boolean()
            .optional()
            .describe(
              'Whether the framework should resume the file system at the next sign-in session. True by default'
            ),
        },
      },
      async ({
        fileSystemId,
        displayName,
        writable,
        openedFilesLimit,
        supportsNotifyTag,
        persistent,
      }) => {
        try {
          const options: chrome.fileSystemProvider.MountOptions = {
            fileSystemId,
            displayName,
          };

          if (writable !== undefined) {
            options.writable = writable;
          }

          if (openedFilesLimit !== undefined) {
            options.openedFilesLimit = openedFilesLimit;
          }

          if (supportsNotifyTag !== undefined) {
            options.supportsNotifyTag = supportsNotifyTag;
          }

          if (persistent !== undefined) {
            options.persistent = persistent;
          }

          await new Promise<void>((resolve, reject) => {
            chrome.fileSystemProvider.mount(options, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('File system mounted successfully', {
            fileSystemId,
            displayName,
            writable: options.writable,
            openedFilesLimit: options.openedFilesLimit,
            supportsNotifyTag: options.supportsNotifyTag,
            persistent: options.persistent,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerUnmount(): void {
    this.server.registerTool(
      'extension_tool_unmount_file_system',
      {
        description: 'Unmount a file system with the given fileSystemId',
        inputSchema: {
          fileSystemId: z.string().describe('The identifier of the file system to be unmounted'),
        },
      },
      async ({ fileSystemId }) => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.fileSystemProvider.unmount({ fileSystemId }, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('File system unmounted successfully', { fileSystemId });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGet(): void {
    this.server.registerTool(
      'extension_tool_get_file_system',
      {
        description: 'Get information about a file system with the specified fileSystemId',
        inputSchema: {
          fileSystemId: z
            .string()
            .describe('The identifier of the file system to retrieve information about'),
        },
      },
      async ({ fileSystemId }) => {
        try {
          const fileSystem = await new Promise<chrome.fileSystemProvider.FileSystemInfo>(
            (resolve, reject) => {
              chrome.fileSystemProvider.get(fileSystemId, (fileSystem) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(fileSystem);
                }
              });
            }
          );

          return this.formatJson({
            fileSystemId: fileSystem.fileSystemId,
            displayName: fileSystem.displayName,
            writable: fileSystem.writable,
            openedFilesLimit: fileSystem.openedFilesLimit,
            supportsNotifyTag: fileSystem.supportsNotifyTag,
            openedFiles: fileSystem.openedFiles.map((file) => ({
              filePath: file.filePath,
              mode: file.mode,
              openRequestId: file.openRequestId,
            })),
            watchers: fileSystem.watchers.map((watcher) => ({
              entryPath: watcher.entryPath,
              recursive: watcher.recursive,
              lastTag: watcher.lastTag,
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
      'extension_tool_get_all_file_systems',
      {
        description: 'Get all file systems mounted by the extension',
        inputSchema: {},
      },
      async () => {
        try {
          const fileSystems = await new Promise<chrome.fileSystemProvider.FileSystemInfo[]>(
            (resolve, reject) => {
              chrome.fileSystemProvider.getAll((fileSystems) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(fileSystems);
                }
              });
            }
          );

          return this.formatJson({
            count: fileSystems.length,
            fileSystems: fileSystems.map((fileSystem) => ({
              fileSystemId: fileSystem.fileSystemId,
              displayName: fileSystem.displayName,
              writable: fileSystem.writable,
              openedFilesLimit: fileSystem.openedFilesLimit,
              supportsNotifyTag: fileSystem.supportsNotifyTag,
              openedFilesCount: fileSystem.openedFiles.length,
              watchersCount: fileSystem.watchers.length,
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerNotify(): void {
    this.server.registerTool(
      'extension_tool_notify_file_system_changes',
      {
        description:
          'Notify about changes in the watched directory at observedPath in recursive mode',
        inputSchema: {
          fileSystemId: z
            .string()
            .describe('The identifier of the file system related to this change'),
          observedPath: z.string().describe('The path of the observed entry'),
          recursive: z.boolean().describe('Mode of the observed entry'),
          changeType: z
            .enum(['CHANGED', 'DELETED'])
            .describe('The type of the change which happened to the observed entry'),
          tag: z
            .string()
            .optional()
            .describe(
              'Tag for the notification. Required if the file system was mounted with the supportsNotifyTag option'
            ),
          changes: z
            .array(
              z.object({
                entryPath: z.string().describe('The path of the changed entry'),
                changeType: z
                  .enum(['CHANGED', 'DELETED'])
                  .describe('The type of the change which happened to the entry'),
              })
            )
            .optional()
            .describe('List of changes to entries within the observed directory'),
        },
      },
      async ({ fileSystemId, observedPath, recursive, changeType, tag, changes }) => {
        try {
          const options: chrome.fileSystemProvider.NotifyOptions = {
            fileSystemId,
            observedPath,
            recursive,
            changeType,
          };

          if (tag !== undefined) {
            options.tag = tag;
          }

          if (changes !== undefined) {
            options.changes = changes.map((change) => ({
              entryPath: change.entryPath,
              changeType: change.changeType,
            }));
          }

          await new Promise<void>((resolve, reject) => {
            chrome.fileSystemProvider.notify(options, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('File system changes notified successfully', {
            fileSystemId,
            observedPath,
            recursive,
            changeType,
            tag,
            changesCount: changes?.length || 0,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
