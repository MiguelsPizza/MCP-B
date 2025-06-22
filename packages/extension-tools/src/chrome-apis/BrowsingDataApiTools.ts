import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface BrowsingDataApiToolsOptions {
  remove?: boolean;
  removeAppcache?: boolean;
  removeCache?: boolean;
  removeCacheStorage?: boolean;
  removeCookies?: boolean;
  removeDownloads?: boolean;
  removeFileSystems?: boolean;
  removeFormData?: boolean;
  removeHistory?: boolean;
  removeIndexedDB?: boolean;
  removeLocalStorage?: boolean;
  removePasswords?: boolean;
  removeServiceWorkers?: boolean;
  removeWebSQL?: boolean;
  settings?: boolean;
}

export class BrowsingDataApiTools extends BaseApiTools {
  protected apiName = 'BrowsingData';

  constructor(
    server: McpServer,
    options: BrowsingDataApiToolsOptions = {}
  ) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.browsingData) {
        return {
          available: false,
          message: 'chrome.browsingData API is not defined',
          details: 'This extension needs the "browsingData" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.browsingData.settings !== 'function') {
        return {
          available: false,
          message: 'chrome.browsingData.settings is not available',
          details: 'The browsingData API appears to be partially available. Check manifest permissions.',
        };
      }

      // Try to actually use the API
      chrome.browsingData.settings((_result) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'BrowsingData API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.browsingData API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('remove')) {
      this.registerRemove();
    }

    if (this.shouldRegisterTool('removeAppcache')) {
      this.registerRemoveAppcache();
    }

    if (this.shouldRegisterTool('removeCache')) {
      this.registerRemoveCache();
    }

    if (this.shouldRegisterTool('removeCacheStorage')) {
      this.registerRemoveCacheStorage();
    }

    if (this.shouldRegisterTool('removeCookies')) {
      this.registerRemoveCookies();
    }

    if (this.shouldRegisterTool('removeDownloads')) {
      this.registerRemoveDownloads();
    }

    if (this.shouldRegisterTool('removeFileSystems')) {
      this.registerRemoveFileSystems();
    }

    if (this.shouldRegisterTool('removeFormData')) {
      this.registerRemoveFormData();
    }

    if (this.shouldRegisterTool('removeHistory')) {
      this.registerRemoveHistory();
    }

    if (this.shouldRegisterTool('removeIndexedDB')) {
      this.registerRemoveIndexedDB();
    }

    if (this.shouldRegisterTool('removeLocalStorage')) {
      this.registerRemoveLocalStorage();
    }

    if (this.shouldRegisterTool('removePasswords')) {
      this.registerRemovePasswords();
    }

    if (this.shouldRegisterTool('removeServiceWorkers')) {
      this.registerRemoveServiceWorkers();
    }

    if (this.shouldRegisterTool('removeWebSQL')) {
      this.registerRemoveWebSQL();
    }

    if (this.shouldRegisterTool('settings')) {
      this.registerSettings();
    }
  }

  private registerRemove(): void {
    this.server.registerTool(
      'remove_browsing_data',
      {
        description: 'Remove various types of browsing data from the user\'s profile',
        inputSchema: {
          since: z
            .number()
            .optional()
            .describe('Remove data accumulated on or after this date (milliseconds since epoch)'),
          origins: z
            .array(z.string())
            .optional()
            .describe('Only remove data for these origins (cookies, storage, cache only)'),
          excludeOrigins: z
            .array(z.string())
            .optional()
            .describe('Exclude data for these origins from deletion'),
          originTypes: z
            .object({
              unprotectedWeb: z.boolean().optional(),
              protectedWeb: z.boolean().optional(),
              extension: z.boolean().optional(),
            })
            .optional()
            .describe('Types of origins to clear'),
          appcache: z.boolean().optional().describe('Remove websites\' appcaches'),
          cache: z.boolean().optional().describe('Remove browser cache'),
          cacheStorage: z.boolean().optional().describe('Remove cache storage'),
          cookies: z.boolean().optional().describe('Remove cookies'),
          downloads: z.boolean().optional().describe('Remove download list'),
          fileSystems: z.boolean().optional().describe('Remove websites\' file systems'),
          formData: z.boolean().optional().describe('Remove stored form data'),
          history: z.boolean().optional().describe('Remove browser history'),
          indexedDB: z.boolean().optional().describe('Remove IndexedDB data'),
          localStorage: z.boolean().optional().describe('Remove local storage data'),
          passwords: z.boolean().optional().describe('Remove stored passwords'),
          serviceWorkers: z.boolean().optional().describe('Remove service workers'),
          webSQL: z.boolean().optional().describe('Remove WebSQL data'),
        },
      },
      async ({
        since,
        origins,
        excludeOrigins,
        originTypes,
        appcache,
        cache,
        cacheStorage,
        cookies,
        downloads,
        fileSystems,
        formData,
        history,
        indexedDB,
        localStorage,
        passwords,
        serviceWorkers,
        webSQL,
      }) => {
        try {
          const options: chrome.browsingData.RemovalOptions = {};
          if (since !== undefined) options.since = since;
          if (origins !== undefined) options.origins = origins as [string, ...string[]];
          if (excludeOrigins !== undefined) options.excludeOrigins = excludeOrigins;
          if (originTypes !== undefined) options.originTypes = originTypes;

          const dataToRemove: chrome.browsingData.DataTypeSet = {};
          if (appcache !== undefined) dataToRemove.appcache = appcache;
          if (cache !== undefined) dataToRemove.cache = cache;
          if (cacheStorage !== undefined) dataToRemove.cacheStorage = cacheStorage;
          if (cookies !== undefined) dataToRemove.cookies = cookies;
          if (downloads !== undefined) dataToRemove.downloads = downloads;
          if (fileSystems !== undefined) dataToRemove.fileSystems = fileSystems;
          if (formData !== undefined) dataToRemove.formData = formData;
          if (history !== undefined) dataToRemove.history = history;
          if (indexedDB !== undefined) dataToRemove.indexedDB = indexedDB;
          if (localStorage !== undefined) dataToRemove.localStorage = localStorage;
          if (passwords !== undefined) dataToRemove.passwords = passwords;
          if (serviceWorkers !== undefined) dataToRemove.serviceWorkers = serviceWorkers;
          if (webSQL !== undefined) dataToRemove.webSQL = webSQL;

          await new Promise<void>((resolve, reject) => {
            chrome.browsingData.remove(options, dataToRemove, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Browsing data removed successfully', {
            options,
            dataTypes: Object.keys(dataToRemove).filter(key => dataToRemove[key as keyof chrome.browsingData.DataTypeSet]),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerRemoveAppcache(): void {
    this.server.registerTool(
      'remove_appcache',
      {
        description: 'Remove websites\' appcache data',
        inputSchema: {
          since: z
            .number()
            .optional()
            .describe('Remove data accumulated on or after this date (milliseconds since epoch)'),
          origins: z
            .array(z.string())
            .optional()
            .describe('Only remove data for these origins'),
          excludeOrigins: z
            .array(z.string())
            .optional()
            .describe('Exclude data for these origins from deletion'),
          originTypes: z
            .object({
              unprotectedWeb: z.boolean().optional(),
              protectedWeb: z.boolean().optional(),
              extension: z.boolean().optional(),
            })
            .optional()
            .describe('Types of origins to clear'),
        },
      },
      async ({ since, origins, excludeOrigins, originTypes }) => {
        try {
          const options: chrome.browsingData.RemovalOptions = {};
          if (since !== undefined) options.since = since;
          if (origins !== undefined) options.origins = origins as [string, ...string[]];
          if (excludeOrigins !== undefined) options.excludeOrigins = excludeOrigins;
          if (originTypes !== undefined) options.originTypes = originTypes;

          await new Promise<void>((resolve, reject) => {
            chrome.browsingData.removeAppcache(options, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Appcache data removed successfully', { options });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerRemoveCache(): void {
    this.server.registerTool(
      'remove_cache',
      {
        description: 'Remove browser cache',
        inputSchema: {
          since: z
            .number()
            .optional()
            .describe('Remove data accumulated on or after this date (milliseconds since epoch)'),
          origins: z
            .array(z.string())
            .optional()
            .describe('Only remove data for these origins'),
          excludeOrigins: z
            .array(z.string())
            .optional()
            .describe('Exclude data for these origins from deletion'),
          originTypes: z
            .object({
              unprotectedWeb: z.boolean().optional(),
              protectedWeb: z.boolean().optional(),
              extension: z.boolean().optional(),
            })
            .optional()
            .describe('Types of origins to clear'),
        },
      },
      async ({ since, origins, excludeOrigins, originTypes }) => {
        try {
          const options: chrome.browsingData.RemovalOptions = {};
          if (since !== undefined) options.since = since;
          if (origins !== undefined) options.origins = origins as [string, ...string[]];
          if (excludeOrigins !== undefined) options.excludeOrigins = excludeOrigins;
          if (originTypes !== undefined) options.originTypes = originTypes;

          await new Promise<void>((resolve, reject) => {
            chrome.browsingData.removeCache(options, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Cache removed successfully', { options });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerRemoveCacheStorage(): void {
    this.server.registerTool(
      'remove_cache_storage',
      {
        description: 'Remove websites\' cache storage data',
        inputSchema: {
          since: z
            .number()
            .optional()
            .describe('Remove data accumulated on or after this date (milliseconds since epoch)'),
          origins: z
            .array(z.string())
            .optional()
            .describe('Only remove data for these origins'),
          excludeOrigins: z
            .array(z.string())
            .optional()
            .describe('Exclude data for these origins from deletion'),
          originTypes: z
            .object({
              unprotectedWeb: z.boolean().optional(),
              protectedWeb: z.boolean().optional(),
              extension: z.boolean().optional(),
            })
            .optional()
            .describe('Types of origins to clear'),
        },
      },
      async ({ since, origins, excludeOrigins, originTypes }) => {
        try {
          const options: chrome.browsingData.RemovalOptions = {};
          if (since !== undefined) options.since = since;
          if (origins !== undefined) options.origins = origins as [string, ...string[]];
          if (excludeOrigins !== undefined) options.excludeOrigins = excludeOrigins;
          if (originTypes !== undefined) options.originTypes = originTypes;

          await new Promise<void>((resolve, reject) => {
            chrome.browsingData.removeCacheStorage(options, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Cache storage removed successfully', { options });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerRemoveCookies(): void {
    this.server.registerTool(
      'remove_cookies',
      {
        description: 'Remove browser cookies and server-bound certificates',
        inputSchema: {
          since: z
            .number()
            .optional()
            .describe('Remove data accumulated on or after this date (milliseconds since epoch)'),
          origins: z
            .array(z.string())
            .optional()
            .describe('Only remove data for these origins'),
          excludeOrigins: z
            .array(z.string())
            .optional()
            .describe('Exclude data for these origins from deletion'),
          originTypes: z
            .object({
              unprotectedWeb: z.boolean().optional(),
              protectedWeb: z.boolean().optional(),
              extension: z.boolean().optional(),
            })
            .optional()
            .describe('Types of origins to clear'),
        },
      },
      async ({ since, origins, excludeOrigins, originTypes }) => {
        try {
          const options: chrome.browsingData.RemovalOptions = {};
          if (since !== undefined) options.since = since;
          if (origins !== undefined) options.origins = origins as [string, ...string[]];
          if (excludeOrigins !== undefined) options.excludeOrigins = excludeOrigins;
          if (originTypes !== undefined) options.originTypes = originTypes;

          await new Promise<void>((resolve, reject) => {
            chrome.browsingData.removeCookies(options, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Cookies removed successfully', { options });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerRemoveDownloads(): void {
    this.server.registerTool(
      'remove_downloads',
      {
        description: 'Remove browser download list (not the downloaded files themselves)',
        inputSchema: {
          since: z
            .number()
            .optional()
            .describe('Remove data accumulated on or after this date (milliseconds since epoch)'),
          originTypes: z
            .object({
              unprotectedWeb: z.boolean().optional(),
              protectedWeb: z.boolean().optional(),
              extension: z.boolean().optional(),
            })
            .optional()
            .describe('Types of origins to clear'),
        },
      },
      async ({ since, originTypes }) => {
        try {
          const options: chrome.browsingData.RemovalOptions = {};
          if (since !== undefined) options.since = since;
          if (originTypes !== undefined) options.originTypes = originTypes;

          await new Promise<void>((resolve, reject) => {
            chrome.browsingData.removeDownloads(options, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Download list removed successfully', { options });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerRemoveFileSystems(): void {
    this.server.registerTool(
      'remove_file_systems',
      {
        description: 'Remove websites\' file system data',
        inputSchema: {
          since: z
            .number()
            .optional()
            .describe('Remove data accumulated on or after this date (milliseconds since epoch)'),
          origins: z
            .array(z.string())
            .optional()
            .describe('Only remove data for these origins'),
          excludeOrigins: z
            .array(z.string())
            .optional()
            .describe('Exclude data for these origins from deletion'),
          originTypes: z
            .object({
              unprotectedWeb: z.boolean().optional(),
              protectedWeb: z.boolean().optional(),
              extension: z.boolean().optional(),
            })
            .optional()
            .describe('Types of origins to clear'),
        },
      },
      async ({ since, origins, excludeOrigins, originTypes }) => {
        try {
          const options: chrome.browsingData.RemovalOptions = {};
          if (since !== undefined) options.since = since;
          if (origins !== undefined) options.origins = origins as [string, ...string[]];
          if (excludeOrigins !== undefined) options.excludeOrigins = excludeOrigins;
          if (originTypes !== undefined) options.originTypes = originTypes;

          await new Promise<void>((resolve, reject) => {
            chrome.browsingData.removeFileSystems(options, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('File systems removed successfully', { options });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerRemoveFormData(): void {
    this.server.registerTool(
      'remove_form_data',
      {
        description: 'Remove browser stored form data (autofill)',
        inputSchema: {
          since: z
            .number()
            .optional()
            .describe('Remove data accumulated on or after this date (milliseconds since epoch)'),
          originTypes: z
            .object({
              unprotectedWeb: z.boolean().optional(),
              protectedWeb: z.boolean().optional(),
              extension: z.boolean().optional(),
            })
            .optional()
            .describe('Types of origins to clear'),
        },
      },
      async ({ since, originTypes }) => {
        try {
          const options: chrome.browsingData.RemovalOptions = {};
          if (since !== undefined) options.since = since;
          if (originTypes !== undefined) options.originTypes = originTypes;

          await new Promise<void>((resolve, reject) => {
            chrome.browsingData.removeFormData(options, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Form data removed successfully', { options });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerRemoveHistory(): void {
    this.server.registerTool(
      'remove_history',
      {
        description: 'Remove browser history',
        inputSchema: {
          since: z
            .number()
            .optional()
            .describe('Remove data accumulated on or after this date (milliseconds since epoch)'),
          originTypes: z
            .object({
              unprotectedWeb: z.boolean().optional(),
              protectedWeb: z.boolean().optional(),
              extension: z.boolean().optional(),
            })
            .optional()
            .describe('Types of origins to clear'),
        },
      },
      async ({ since, originTypes }) => {
        try {
          const options: chrome.browsingData.RemovalOptions = {};
          if (since !== undefined) options.since = since;
          if (originTypes !== undefined) options.originTypes = originTypes;

          await new Promise<void>((resolve, reject) => {
            chrome.browsingData.removeHistory(options, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('History removed successfully', { options });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerRemoveIndexedDB(): void {
    this.server.registerTool(
      'remove_indexed_db',
      {
        description: 'Remove websites\' IndexedDB data',
        inputSchema: {
          since: z
            .number()
            .optional()
            .describe('Remove data accumulated on or after this date (milliseconds since epoch)'),
          origins: z
            .array(z.string())
            .optional()
            .describe('Only remove data for these origins'),
          excludeOrigins: z
            .array(z.string())
            .optional()
            .describe('Exclude data for these origins from deletion'),
          originTypes: z
            .object({
              unprotectedWeb: z.boolean().optional(),
              protectedWeb: z.boolean().optional(),
              extension: z.boolean().optional(),
            })
            .optional()
            .describe('Types of origins to clear'),
        },
      },
      async ({ since, origins, excludeOrigins, originTypes }) => {
        try {
          const options: chrome.browsingData.RemovalOptions = {};
          if (since !== undefined) options.since = since;
          if (origins !== undefined) options.origins = origins as [string, ...string[]];
          if (excludeOrigins !== undefined) options.excludeOrigins = excludeOrigins;
          if (originTypes !== undefined) options.originTypes = originTypes;

          await new Promise<void>((resolve, reject) => {
            chrome.browsingData.removeIndexedDB(options, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('IndexedDB data removed successfully', { options });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerRemoveLocalStorage(): void {
    this.server.registerTool(
      'remove_local_storage',
      {
        description: 'Remove websites\' local storage data',
        inputSchema: {
          since: z
            .number()
            .optional()
            .describe('Remove data accumulated on or after this date (milliseconds since epoch)'),
          origins: z
            .array(z.string())
            .optional()
            .describe('Only remove data for these origins'),
          excludeOrigins: z
            .array(z.string())
            .optional()
            .describe('Exclude data for these origins from deletion'),
          originTypes: z
            .object({
              unprotectedWeb: z.boolean().optional(),
              protectedWeb: z.boolean().optional(),
              extension: z.boolean().optional(),
            })
            .optional()
            .describe('Types of origins to clear'),
        },
      },
      async ({ since, origins, excludeOrigins, originTypes }) => {
        try {
          const options: chrome.browsingData.RemovalOptions = {};
          if (since !== undefined) options.since = since;
          if (origins !== undefined) options.origins = origins as [string, ...string[]];
          if (excludeOrigins !== undefined) options.excludeOrigins = excludeOrigins;
          if (originTypes !== undefined) options.originTypes = originTypes;

          await new Promise<void>((resolve, reject) => {
            chrome.browsingData.removeLocalStorage(options, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Local storage removed successfully', { options });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerRemovePasswords(): void {
    this.server.registerTool(
      'remove_passwords',
      {
        description: 'Remove browser stored passwords',
        inputSchema: {
          since: z
            .number()
            .optional()
            .describe('Remove data accumulated on or after this date (milliseconds since epoch)'),
          originTypes: z
            .object({
              unprotectedWeb: z.boolean().optional(),
              protectedWeb: z.boolean().optional(),
              extension: z.boolean().optional(),
            })
            .optional()
            .describe('Types of origins to clear'),
        },
      },
      async ({ since, originTypes }) => {
        try {
          const options: chrome.browsingData.RemovalOptions = {};
          if (since !== undefined) options.since = since;
          if (originTypes !== undefined) options.originTypes = originTypes;

          await new Promise<void>((resolve, reject) => {
            chrome.browsingData.removePasswords(options, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Passwords removed successfully', { options });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerRemoveServiceWorkers(): void {
    this.server.registerTool(
      'remove_service_workers',
      {
        description: 'Remove websites\' service workers',
        inputSchema: {
          since: z
            .number()
            .optional()
            .describe('Remove data accumulated on or after this date (milliseconds since epoch)'),
          origins: z
            .array(z.string())
            .optional()
            .describe('Only remove data for these origins'),
          excludeOrigins: z
            .array(z.string())
            .optional()
            .describe('Exclude data for these origins from deletion'),
          originTypes: z
            .object({
              unprotectedWeb: z.boolean().optional(),
              protectedWeb: z.boolean().optional(),
              extension: z.boolean().optional(),
            })
            .optional()
            .describe('Types of origins to clear'),
        },
      },
      async ({ since, origins, excludeOrigins, originTypes }) => {
        try {
          const options: chrome.browsingData.RemovalOptions = {};
          if (since !== undefined) options.since = since;
          if (origins !== undefined) options.origins = origins as [string, ...string[]];
          if (excludeOrigins !== undefined) options.excludeOrigins = excludeOrigins;
          if (originTypes !== undefined) options.originTypes = originTypes;

          await new Promise<void>((resolve, reject) => {
            chrome.browsingData.removeServiceWorkers(options, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Service workers removed successfully', { options });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerRemoveWebSQL(): void {
    this.server.registerTool(
      'remove_web_sql',
      {
        description: 'Remove websites\' WebSQL data',
        inputSchema: {
          since: z
            .number()
            .optional()
            .describe('Remove data accumulated on or after this date (milliseconds since epoch)'),
          origins: z
            .array(z.string())
            .optional()
            .describe('Only remove data for these origins'),
          excludeOrigins: z
            .array(z.string())
            .optional()
            .describe('Exclude data for these origins from deletion'),
          originTypes: z
            .object({
              unprotectedWeb: z.boolean().optional(),
              protectedWeb: z.boolean().optional(),
              extension: z.boolean().optional(),
            })
            .optional()
            .describe('Types of origins to clear'),
        },
      },
      async ({ since, origins, excludeOrigins, originTypes }) => {
        try {
          const options: chrome.browsingData.RemovalOptions = {};
          if (since !== undefined) options.since = since;
          if (origins !== undefined) options.origins = origins as [string, ...string[]];
          if (excludeOrigins !== undefined) options.excludeOrigins = excludeOrigins;
          if (originTypes !== undefined) options.originTypes = originTypes;

          await new Promise<void>((resolve, reject) => {
            chrome.browsingData.removeWebSQL(options, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('WebSQL data removed successfully', { options });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSettings(): void {
    this.server.registerTool(
      'get_browsing_data_settings',
      {
        description: 'Get current browsing data settings from the Clear browsing data UI',
        inputSchema: {},
      },
      async () => {
        try {
          const result = await new Promise<{
            dataRemovalPermitted: chrome.browsingData.DataTypeSet;
            dataToRemove: chrome.browsingData.DataTypeSet;
            options: chrome.browsingData.RemovalOptions;
          }>((resolve, reject) => {
            chrome.browsingData.settings((result) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(result);
              }
            });
          });

          return this.formatJson({
            dataRemovalPermitted: result.dataRemovalPermitted,
            dataToRemove: result.dataToRemove,
            options: result.options,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}