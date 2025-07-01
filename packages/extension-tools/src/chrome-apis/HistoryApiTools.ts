import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { type ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface HistoryApiToolsOptions {
  addUrl?: boolean;
  deleteAll?: boolean;
  deleteRange?: boolean;
  deleteUrl?: boolean;
  getVisits?: boolean;
  search?: boolean;
}

export class HistoryApiTools extends BaseApiTools {
  protected apiName = 'History';

  constructor(server: McpServer, options: HistoryApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.history) {
        return {
          available: false,
          message: 'chrome.history API is not defined',
          details: 'This extension needs the "history" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.history.search !== 'function') {
        return {
          available: false,
          message: 'chrome.history.search is not available',
          details: 'The history API appears to be partially available. Check manifest permissions.',
        };
      }

      // Try to actually use the API
      chrome.history.search({ text: '', maxResults: 1 }, (_results) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'History API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.history API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('addUrl')) {
      this.registerAddUrl();
    }

    if (this.shouldRegisterTool('deleteAll')) {
      this.registerDeleteAll();
    }

    if (this.shouldRegisterTool('deleteRange')) {
      this.registerDeleteRange();
    }

    if (this.shouldRegisterTool('deleteUrl')) {
      this.registerDeleteUrl();
    }

    if (this.shouldRegisterTool('getVisits')) {
      this.registerGetVisits();
    }

    if (this.shouldRegisterTool('search')) {
      this.registerSearch();
    }
  }

  private registerAddUrl(): void {
    this.server.registerTool(
      'extension_tool_add_url',
      {
        description:
          'Add a URL to the history at the current time with a transition type of "link"',
        inputSchema: {
          url: z.string().url().describe('The URL to add to history. Must be a valid URL format'),
        },
      },
      async ({ url }) => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.history.addUrl({ url }, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('URL added to history successfully', { url });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerDeleteAll(): void {
    this.server.registerTool(
      'extension_tool_delete_all_history',
      {
        description: 'Delete all items from the browser history',
        inputSchema: {},
      },
      async () => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.history.deleteAll(() => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('All history deleted successfully');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerDeleteRange(): void {
    this.server.registerTool(
      'extension_tool_delete_history_range',
      {
        description:
          'Remove all items within the specified date range from history. Pages will not be removed unless all visits fall within the range',
        inputSchema: {
          startTime: z
            .number()
            .describe(
              'Items added to history after this date, represented in milliseconds since the epoch'
            ),
          endTime: z
            .number()
            .describe(
              'Items added to history before this date, represented in milliseconds since the epoch'
            ),
        },
      },
      async ({ startTime, endTime }) => {
        try {
          if (startTime >= endTime) {
            return this.formatError('startTime must be less than endTime');
          }

          await new Promise<void>((resolve, reject) => {
            chrome.history.deleteRange({ startTime, endTime }, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('History range deleted successfully', {
            startTime,
            endTime,
            startTimeFormatted: new Date(startTime).toISOString(),
            endTimeFormatted: new Date(endTime).toISOString(),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerDeleteUrl(): void {
    this.server.registerTool(
      'extension_tool_delete_url',
      {
        description: 'Remove all occurrences of the given URL from history',
        inputSchema: {
          url: z
            .string()
            .url()
            .describe(
              'The URL to remove from history. Must be in the format as returned from a call to history.search()'
            ),
        },
      },
      async ({ url }) => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.history.deleteUrl({ url }, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('URL deleted from history successfully', { url });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetVisits(): void {
    this.server.registerTool(
      'extension_tool_get_visits',
      {
        description: 'Retrieve information about visits to a specific URL',
        inputSchema: {
          url: z
            .string()
            .url()
            .describe(
              'The URL to get visit information for. Must be in the format as returned from a call to history.search()'
            ),
        },
      },
      async ({ url }) => {
        try {
          const visits = await new Promise<chrome.history.VisitItem[]>((resolve, reject) => {
            chrome.history.getVisits({ url }, (visits) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(visits);
              }
            });
          });

          return this.formatJson({
            url,
            visitCount: visits.length,
            visits: visits.map((visit) => ({
              id: visit.id,
              visitId: visit.visitId,
              visitTime: visit.visitTime,
              visitTimeFormatted: visit.visitTime
                ? new Date(visit.visitTime).toISOString()
                : undefined,
              referringVisitId: visit.referringVisitId,
              transition: visit.transition,
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSearch(): void {
    this.server.registerTool(
      'extension_tool_search_history',
      {
        description: 'Search the history for the last visit time of each page matching the query',
        inputSchema: {
          text: z
            .string()
            .describe(
              'A free-text query to the history service. Leave empty to retrieve all pages'
            ),
          startTime: z
            .number()
            .optional()
            .describe(
              'Limit results to those visited after this date, represented in milliseconds since the epoch. Defaults to 24 hours ago if not specified'
            ),
          endTime: z
            .number()
            .optional()
            .describe(
              'Limit results to those visited before this date, represented in milliseconds since the epoch'
            ),
          maxResults: z
            .number()
            .min(1)
            .max(1000)
            .optional()
            .describe('The maximum number of results to retrieve. Defaults to 100'),
        },
      },
      async ({ text, startTime, endTime, maxResults }) => {
        try {
          const query: any = { text };

          if (startTime !== undefined) {
            query.startTime = startTime;
          }

          if (endTime !== undefined) {
            query.endTime = endTime;
          }

          if (maxResults !== undefined) {
            query.maxResults = maxResults;
          }

          const results = await new Promise<chrome.history.HistoryItem[]>((resolve, reject) => {
            chrome.history.search(query, (results) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(results);
              }
            });
          });

          return this.formatJson({
            query: {
              text,
              startTime,
              endTime,
              maxResults,
            },
            resultCount: results.length,
            results: results.map((item) => ({
              id: item.id,
              url: item.url,
              title: item.title,
              lastVisitTime: item.lastVisitTime,
              lastVisitTimeFormatted: item.lastVisitTime
                ? new Date(item.lastVisitTime).toISOString()
                : undefined,
              visitCount: item.visitCount,
              typedCount: item.typedCount,
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
