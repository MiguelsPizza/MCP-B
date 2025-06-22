import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface ReadingListApiToolsOptions {
  addEntry?: boolean;
  query?: boolean;
  removeEntry?: boolean;
  updateEntry?: boolean;
}

export class ReadingListApiTools extends BaseApiTools {
  protected apiName = 'ReadingList';

  constructor(
    server: McpServer,
    options: ReadingListApiToolsOptions = {}
  ) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.readingList) {
        return {
          available: false,
          message: 'chrome.readingList API is not defined',
          details: 'This extension needs the "readingList" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.readingList.query !== 'function') {
        return {
          available: false,
          message: 'chrome.readingList.query is not available',
          details: 'The readingList API appears to be partially available. Check manifest permissions.',
        };
      }

      // Try to actually use the API
      chrome.readingList.query({}, (_entries) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'ReadingList API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.readingList API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('addEntry')) {
      this.registerAddEntry();
    }

    if (this.shouldRegisterTool('query')) {
      this.registerQuery();
    }

    if (this.shouldRegisterTool('removeEntry')) {
      this.registerRemoveEntry();
    }

    if (this.shouldRegisterTool('updateEntry')) {
      this.registerUpdateEntry();
    }
  }

  private registerAddEntry(): void {
    this.server.registerTool(
      'add_reading_list_entry',
      {
        description: 'Add an entry to the reading list if it does not exist',
        inputSchema: {
          title: z.string().describe('The title of the entry'),
          url: z.string().url().describe('The URL of the entry'),
          hasBeenRead: z.boolean().describe('Whether the entry has been read'),
        },
      },
      async ({ title, url, hasBeenRead }) => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.readingList.addEntry(
              {
                title,
                url,
                hasBeenRead,
              },
              () => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve();
                }
              }
            );
          });

          return this.formatSuccess('Reading list entry added successfully', {
            title,
            url,
            hasBeenRead,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerQuery(): void {
    this.server.registerTool(
      'query_reading_list',
      {
        description: 'Retrieve all entries that match the query criteria. Properties that are not provided will not be matched',
        inputSchema: {
          hasBeenRead: z
            .boolean()
            .optional()
            .describe('Indicates whether to search for read (true) or unread (false) items'),
          title: z.string().optional().describe('A title to search for'),
          url: z.string().optional().describe('A URL to search for'),
        },
      },
      async ({ hasBeenRead, title, url }) => {
        try {
          const queryInfo: chrome.readingList.QueryInfo = {};
          if (hasBeenRead !== undefined) queryInfo.hasBeenRead = hasBeenRead;
          if (title !== undefined) queryInfo.title = title;
          if (url !== undefined) queryInfo.url = url;

          const entries = await new Promise<chrome.readingList.ReadingListEntry[]>(
            (resolve, reject) => {
              chrome.readingList.query(queryInfo, (entries) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(entries);
                }
              });
            }
          );

          return this.formatJson({
            count: entries.length,
            entries: entries.map((entry) => ({
              title: entry.title,
              url: entry.url,
              hasBeenRead: entry.hasBeenRead,
              creationTime: entry.creationTime,
              creationTimeFormatted: new Date(entry.creationTime).toISOString(),
              lastUpdateTime: entry.lastUpdateTime,
              lastUpdateTimeFormatted: new Date(entry.lastUpdateTime).toISOString(),
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerRemoveEntry(): void {
    this.server.registerTool(
      'remove_reading_list_entry',
      {
        description: 'Remove an entry from the reading list if it exists',
        inputSchema: {
          url: z.string().url().describe('The URL to remove'),
        },
      },
      async ({ url }) => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.readingList.removeEntry(
              {
                url,
              },
              () => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve();
                }
              }
            );
          });

          return this.formatSuccess('Reading list entry removed successfully', {
            url,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerUpdateEntry(): void {
    this.server.registerTool(
      'update_reading_list_entry',
      {
        description: 'Update a reading list entry if it exists',
        inputSchema: {
          url: z.string().url().describe('The URL that will be updated'),
          title: z
            .string()
            .optional()
            .describe('The new title. The existing title remains if a value is not provided'),
          hasBeenRead: z
            .boolean()
            .optional()
            .describe(
              'The updated read status. The existing status remains if a value is not provided'
            ),
        },
      },
      async ({ url, title, hasBeenRead }) => {
        try {
          const updateInfo: chrome.readingList.UpdateEntryOptions = {
            url,
          };
          if (title !== undefined) updateInfo.title = title;
          if (hasBeenRead !== undefined) updateInfo.hasBeenRead = hasBeenRead;

          await new Promise<void>((resolve, reject) => {
            chrome.readingList.updateEntry(updateInfo, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Reading list entry updated successfully', {
            url,
            title,
            hasBeenRead,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}