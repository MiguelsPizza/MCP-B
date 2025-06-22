import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface StorageApiToolsOptions {
  getStorage?: boolean;
  setStorage?: boolean;
  removeStorage?: boolean;
  clearStorage?: boolean;
  getBytesInUse?: boolean;
}

export class StorageApiTools extends BaseApiTools {
  protected apiName = 'Storage';

  constructor(server: McpServer, options: StorageApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Test basic storage API access
      if (!chrome.storage) {
        return {
          available: false,
          message: 'chrome.storage API is not defined',
          details:
            'This extension needs the "storage" permission in its manifest.json to access storage',
        };
      }

      // Check which storage areas are available
      const availableAreas: string[] = [];
      if (chrome.storage.local) availableAreas.push('local');
      if (chrome.storage.sync) availableAreas.push('sync');
      if (chrome.storage.session) availableAreas.push('session');
      if (chrome.storage.managed) availableAreas.push('managed');

      if (availableAreas.length === 0) {
        return {
          available: false,
          message: 'No storage areas are available',
          details: 'The storage API is present but no storage areas can be accessed',
        };
      }

      // Test actual functionality
      chrome.storage.local.get(null, () => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: `Storage API is available with areas: ${availableAreas.join(', ')}`,
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.storage API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('getStorage')) {
      this.registerGetStorage();
    }

    if (this.shouldRegisterTool('setStorage')) {
      this.registerSetStorage();
    }

    if (this.shouldRegisterTool('removeStorage')) {
      this.registerRemoveStorage();
    }

    if (this.shouldRegisterTool('clearStorage')) {
      this.registerClearStorage();
    }

    if (this.shouldRegisterTool('getBytesInUse')) {
      this.registerGetBytesInUse();
    }
  }

  private getAvailableAreas(): string[] {
    const areas: string[] = [];
    if (chrome.storage.sync) areas.push('sync');
    if (chrome.storage.local) areas.push('local');
    if (chrome.storage.session) areas.push('session');
    return areas;
  }

  private registerGetStorage(): void {
    const availableAreas = this.getAvailableAreas();

    this.server.registerTool(
      'get_storage',
      {
        description: 'Get data from extension storage',
        inputSchema: {
          keys: z.array(z.string()).optional().describe('Specific keys to retrieve (omit for all)'),
          area: z
            .enum(availableAreas as any)
            .optional()
            .describe(
              `Storage area to use. Available: ${availableAreas.join(', ')} (default: local)`
            ),
        },
      },
      async ({ keys, area = 'local' }) => {
        try {
          const storage = chrome.storage[area as keyof typeof chrome.storage] as any;
          if (!storage || typeof storage.get !== 'function') {
            return this.formatError(new Error(`Storage area '${area}' is not available`));
          }

          const data = await storage.get(keys || null);

          // Format the response with metadata
          const response = {
            area,
            data,
            keyCount: Object.keys(data).length,
          };

          return this.formatJson(response);
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetStorage(): void {
    const availableAreas = this.getAvailableAreas();

    this.server.registerTool(
      'set_storage',
      {
        description: 'Set data in extension storage',
        inputSchema: {
          data: z.record(z.any()).describe('Key-value pairs to store'),
          area: z
            .enum(availableAreas as any)
            .optional()
            .describe(
              `Storage area to use. Available: ${availableAreas.join(', ')} (default: local)`
            ),
        },
      },
      async ({ data, area = 'local' }) => {
        try {
          const storage = chrome.storage[area as keyof typeof chrome.storage] as any;
          if (!storage || typeof storage.set !== 'function') {
            return this.formatError(new Error(`Storage area '${area}' is not available`));
          }

          await storage.set(data);

          return this.formatSuccess(
            `Stored ${Object.keys(data).length} key(s) in ${area} storage`,
            { keys: Object.keys(data) }
          );
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerRemoveStorage(): void {
    const availableAreas = this.getAvailableAreas();

    this.server.registerTool(
      'remove_storage',
      {
        description: 'Remove specific keys from extension storage',
        inputSchema: {
          keys: z.array(z.string()).describe('Keys to remove from storage'),
          area: z
            .enum(availableAreas as any)
            .optional()
            .describe(
              `Storage area to use. Available: ${availableAreas.join(', ')} (default: local)`
            ),
        },
      },
      async ({ keys, area = 'local' }) => {
        try {
          const storage = chrome.storage[area as keyof typeof chrome.storage] as any;
          if (!storage || typeof storage.remove !== 'function') {
            return this.formatError(new Error(`Storage area '${area}' is not available`));
          }

          await storage.remove(keys);

          return this.formatSuccess(`Removed ${keys.length} key(s) from ${area} storage`, { keys });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerClearStorage(): void {
    const availableAreas = this.getAvailableAreas();

    this.server.registerTool(
      'clear_storage',
      {
        description: 'Clear all data from a storage area',
        inputSchema: {
          area: z
            .enum(availableAreas as any)
            .describe(`Storage area to clear. Available: ${availableAreas.join(', ')}`),
          confirm: z.boolean().describe('Confirmation flag - must be true to clear storage'),
        },
      },
      async ({ area, confirm }) => {
        try {
          if (!confirm) {
            return this.formatError(
              new Error('Clear operation requires confirm=true to prevent accidental data loss')
            );
          }

          const storage = chrome.storage[area as keyof typeof chrome.storage] as any;
          if (!storage || typeof storage.clear !== 'function') {
            return this.formatError(new Error(`Storage area '${area}' is not available`));
          }

          await storage.clear();

          return this.formatSuccess(`Cleared all data from ${area} storage`);
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetBytesInUse(): void {
    const availableAreas = this.getAvailableAreas();

    this.server.registerTool(
      'get_storage_bytes_in_use',
      {
        description: 'Get the amount of storage space used',
        inputSchema: {
          keys: z.array(z.string()).optional().describe('Specific keys to check (omit for total)'),
          area: z
            .enum(availableAreas as any)
            .optional()
            .describe(
              `Storage area to check. Available: ${availableAreas.join(', ')} (default: local)`
            ),
        },
      },
      async ({ keys, area = 'local' }) => {
        try {
          const storage = chrome.storage[area as keyof typeof chrome.storage] as any;
          if (!storage) {
            return this.formatError(new Error(`Storage area '${area}' is not available`));
          }

          // Not all storage areas support getBytesInUse
          if (typeof storage.getBytesInUse !== 'function') {
            return this.formatError(
              new Error(`getBytesInUse is not supported for ${area} storage area`)
            );
          }

          const bytesInUse = await storage.getBytesInUse(keys || null);

          // Get quota info if available
          let quotaInfo = null;
          if (area === 'sync' && chrome.storage.sync.QUOTA_BYTES) {
            quotaInfo = {
              quotaBytes: chrome.storage.sync.QUOTA_BYTES,
              quotaBytesPerItem: chrome.storage.sync.QUOTA_BYTES_PER_ITEM,
              maxItems: chrome.storage.sync.MAX_ITEMS,
              maxWriteOperationsPerHour: chrome.storage.sync.MAX_WRITE_OPERATIONS_PER_HOUR,
              maxWriteOperationsPerMinute: chrome.storage.sync.MAX_WRITE_OPERATIONS_PER_MINUTE,
            };
          } else if (area === 'local' && chrome.storage.local.QUOTA_BYTES) {
            quotaInfo = {
              quotaBytes: chrome.storage.local.QUOTA_BYTES,
            };
          }

          return this.formatJson({
            area,
            bytesInUse,
            humanReadable: this.formatBytes(bytesInUse),
            quota: quotaInfo,
            percentageUsed: quotaInfo?.quotaBytes
              ? ((bytesInUse / quotaInfo.quotaBytes) * 100).toFixed(2) + '%'
              : null,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
