import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { type ApiAvailability, BaseApiTools } from '../BaseApiTools';
import zodToJsonSchema from 'zod-to-json-schema';

export interface StorageApiToolsOptions {
  getStorage?: boolean;
  setStorage?: boolean;
  removeStorage?: boolean;
  clearStorage?: boolean;
  getBytesInUse?: boolean;
}

export const STORAGE_ACTIONS = [
  'getStorage',
  'setStorage',
  'removeStorage',
  'clearStorage',
  'getBytesInUse',
] as const;

type StorageAction = (typeof STORAGE_ACTIONS)[number];

const storageActionSchema = z.enum(STORAGE_ACTIONS);

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
    this.server.registerTool(
      'extension_tool_storage_operations',
      {
        description: 'Perform operations on Chrome storage API',
        inputSchema: {
          action: storageActionSchema,
          params: z.record(z.any()).optional().describe('Parameters for the chosen action'),
        },
      },
      async ({ action, params = {} }) => {
        try {
          if (!this.shouldRegisterTool(action)) {
            return this.formatError(new Error(`Action "${action}" is not supported`));
          }

          switch (action as StorageAction) {
            case 'getStorage':
              return await this.handleGetStorage(params);
            case 'setStorage':
              return await this.handleSetStorage(params);
            case 'removeStorage':
              return await this.handleRemoveStorage(params);
            case 'clearStorage':
              return await this.handleClearStorage(params);
            case 'getBytesInUse':
              return await this.handleGetBytesInUse(params);
            default:
              return this.formatError(new Error(`Action "${action}" is not supported`));
          }
        } catch (error) {
          return this.formatError(error);
        }
      }
    );

    this.server.registerTool(
      'extension_tool_storage_parameters_description',
      {
        description:
          'Get the parameters for extension_tool_storage_operations tool and the description for the associated action, this tool should be used first before extension_tool_storage_operations',
        inputSchema: {
          action: storageActionSchema,
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
            tool: 'extension_tool_storage_operations',
            action,
            note: 'Use the description to double check if the correct action is chosen. Use this JSON Schema for the params field when calling the tool. The top-level tool input is { action, params }.',
          } as const;

          switch (action as StorageAction) {
            case 'getStorage': {
              const paramsAndDescription = {
                params: toJson(this.getStorageSchema, 'GetStorageParams'),
                description: 'Get data from extension storage',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'setStorage': {
              const paramsAndDescription = {
                params: toJson(this.setStorageSchema, 'SetStorageParams'),
                description: 'Set data in extension storage',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'removeStorage': {
              const paramsAndDescription = {
                params: toJson(this.removeStorageSchema, 'RemoveStorageParams'),
                description: 'Remove specific keys from extension storage',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'clearStorage': {
              const paramsAndDescription = {
                params: toJson(this.clearStorageSchema, 'ClearStorageParams'),
                description: 'Clear all data from a storage area',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'getBytesInUse': {
              const paramsAndDescription = {
                params: toJson(this.getBytesInUseSchema, 'GetBytesInUseParams'),
                description: 'Get the amount of storage space used',
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

  private getAvailableAreas(): string[] {
    const areas: string[] = [];
    if (chrome.storage.sync) areas.push('sync');
    if (chrome.storage.local) areas.push('local');
    if (chrome.storage.session) areas.push('session');
    return areas;
  }

  // ===== Action handlers =====
  private async handleGetStorage(raw: unknown) {
    const { keys, area = 'local' } = this.getStorageSchema.parse(raw);
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
  }

  private async handleSetStorage(raw: unknown) {
    const { data, area = 'local' } = this.setStorageSchema.parse(raw);
    const storage = chrome.storage[area as keyof typeof chrome.storage] as any;
    if (!storage || typeof storage.set !== 'function') {
      return this.formatError(new Error(`Storage area '${area}' is not available`));
    }

    await storage.set(data);

    return this.formatSuccess(`Stored ${Object.keys(data).length} key(s) in ${area} storage`, {
      keys: Object.keys(data),
    });
  }

  private async handleRemoveStorage(raw: unknown) {
    const { keys, area = 'local' } = this.removeStorageSchema.parse(raw);
    const storage = chrome.storage[area as keyof typeof chrome.storage] as any;
    if (!storage || typeof storage.remove !== 'function') {
      return this.formatError(new Error(`Storage area '${area}' is not available`));
    }

    await storage.remove(keys);

    return this.formatSuccess(`Removed ${keys.length} key(s) from ${area} storage`, { keys });
  }

  private async handleClearStorage(raw: unknown) {
    const { area, confirm } = this.clearStorageSchema.parse(raw);
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
  }

  private async handleGetBytesInUse(raw: unknown) {
    const { keys, area = 'local' } = this.getBytesInUseSchema.parse(raw);
    const storage = chrome.storage[area as keyof typeof chrome.storage] as any;
    if (!storage) {
      return this.formatError(new Error(`Storage area '${area}' is not available`));
    }

    // Not all storage areas support getBytesInUse
    if (typeof storage.getBytesInUse !== 'function') {
      return this.formatError(new Error(`getBytesInUse is not supported for ${area} storage area`));
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
  }

  // ===== Validation Schemas per action =====
  private getStorageSchema = z.object({
    keys: z.array(z.string()).optional().describe('Specific keys to retrieve (omit for all)'),
    area: z
      .enum(this.getAvailableAreas() as any)
      .optional()
      .describe(
        `Storage area to use. Available: ${this.getAvailableAreas().join(', ')} (default: local)`
      ),
  });

  private setStorageSchema = z.object({
    data: z.record(z.any()).describe('Key-value pairs to store'),
    area: z
      .enum(this.getAvailableAreas() as any)
      .optional()
      .describe(
        `Storage area to use. Available: ${this.getAvailableAreas().join(', ')} (default: local)`
      ),
  });

  private removeStorageSchema = z.object({
    keys: z.array(z.string()).describe('Keys to remove from storage'),
    area: z
      .enum(this.getAvailableAreas() as any)
      .optional()
      .describe(
        `Storage area to use. Available: ${this.getAvailableAreas().join(', ')} (default: local)`
      ),
  });

  private clearStorageSchema = z.object({
    area: z
      .enum(this.getAvailableAreas() as any)
      .describe(`Storage area to clear. Available: ${this.getAvailableAreas().join(', ')}`),
    confirm: z.boolean().describe('Confirmation flag - must be true to clear storage'),
  });

  private getBytesInUseSchema = z.object({
    keys: z.array(z.string()).optional().describe('Specific keys to check (omit for total)'),
    area: z
      .enum(this.getAvailableAreas() as any)
      .optional()
      .describe(
        `Storage area to check. Available: ${this.getAvailableAreas().join(', ')} (default: local)`
      ),
  });

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / k ** i).toFixed(2)) + ' ' + sizes[i];
  }
}
