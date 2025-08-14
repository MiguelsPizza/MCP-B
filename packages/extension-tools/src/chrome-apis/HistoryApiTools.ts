import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { type ApiAvailability, BaseApiTools } from '../BaseApiTools';
import zodToJsonSchema from 'zod-to-json-schema';

export interface HistoryApiToolsOptions {
  addUrl?: boolean;
  deleteAll?: boolean;
  deleteRange?: boolean;
  deleteUrl?: boolean;
  getVisits?: boolean;
  search?: boolean;
}

export const HISTORY_ACTIONS = [
  'addUrl',
  'deleteAll',
  'deleteRange',
  'deleteUrl',
  'getVisits',
  'search',
] as const;

type HistoryAction = (typeof HISTORY_ACTIONS)[number];

const historyActionSchema = z.enum(HISTORY_ACTIONS);

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
    this.server.registerTool(
      'extension_tool_history_operations',
      {
        description: 'Perform operations on the Chrome History API',
        inputSchema: {
          action: historyActionSchema,
          params: z.record(z.any()).optional().describe('Parameters for the chosen action'),
        },
      },
      async ({ action, params = {} }) => {
        try {
          if (!this.shouldRegisterTool(action)) {
            return this.formatError(new Error(`Action "${action}" is not supported`));
          }

          switch (action as HistoryAction) {
            case 'addUrl':
              return await this.handleAddUrl(params);
            case 'deleteAll':
              return await this.handleDeleteAll();
            case 'deleteRange':
              return await this.handleDeleteRange(params);
            case 'deleteUrl':
              return await this.handleDeleteUrl(params);
            case 'getVisits':
              return await this.handleGetVisits(params);
            case 'search':
              return await this.handleSearch(params);
            default:
              return this.formatError(`Unknown action: ${String(action)}`);
          }
        } catch (error) {
          return this.formatError(error);
        }
      }
    );

    this.server.registerTool(
      'extension_tool_history_parameters_description',
      {
        description:
          'Get the parameters for extension_tool_history_operations tool and the description for the associated action, this tool should be used first before extension_tool_history_operations',
        inputSchema: {
          action: historyActionSchema,
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
            tool: 'extension_tool_history_operations',
            action,
            note: 'Use the description to double check if the correct action is chosen. Use this JSON Schema for the params field when calling the tool. The top-level tool input is { action, params }.',
          } as const;

          switch (action as HistoryAction) {
            case 'addUrl': {
              const paramsAndDescription = {
                params: toJson(this.addUrlSchema, 'AddUrlParams'),
                description:
                  'Add a URL to the history at the current time with a transition type of "link"',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'deleteAll': {
              const paramsAndDescription = {
                params: toJson(this.deleteAllSchema, 'DeleteAllParams'),
                description: 'Delete all items from the browser history',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'deleteRange': {
              const paramsAndDescription = {
                params: toJson(this.deleteRangeSchema, 'DeleteRangeParams'),
                description:
                  'Remove all items within the specified date range from history. Pages will not be removed unless all visits fall within the range',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'deleteUrl': {
              const paramsAndDescription = {
                params: toJson(this.deleteUrlSchema, 'DeleteUrlParams'),
                description: 'Remove all occurrences of the given URL from history',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'getVisits': {
              const paramsAndDescription = {
                params: toJson(this.getVisitsSchema, 'GetVisitsParams'),
                description: 'Retrieve information about visits to a specific URL',
              };
              return this.formatJson({ ...payloadBase, ...paramsAndDescription });
            }
            case 'search': {
              const paramAndDescription = {
                params: toJson(this.searchSchema, 'SearchParams'),
                description:
                  'Search the history for the last visit time of each page matching the query',
              };
              return this.formatJson({ ...payloadBase, ...paramAndDescription });
            }
            default:
              return this.formatError(`Unknown action: ${String(action)}`);
          }
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  // ===== Action handlers =====
  private async handleAddUrl(raw: unknown) {
    const { url } = this.addUrlSchema.parse(raw);
    await chrome.history.addUrl({ url });
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
  }

  private async handleDeleteAll() {
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
  }

  private async handleDeleteRange(raw: unknown) {
    const { startTime, endTime } = this.deleteRangeSchema.parse(raw);
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
  }

  private async handleDeleteUrl(raw: unknown) {
    const { url } = this.deleteUrlSchema.parse(raw);
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
  }

  private async handleGetVisits(raw: unknown) {
    const { url } = this.getVisitsSchema.parse(raw);
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
        visitTimeFormatted: visit.visitTime ? new Date(visit.visitTime).toISOString() : undefined,
        referringVisitId: visit.referringVisitId,
        transition: visit.transition,
      })),
    });
  }

  private async handleSearch(raw: unknown) {
    const { text, startTime, endTime, maxResults } = this.searchSchema.parse(raw);

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
  }

  // ===== Validation Schemas per action =====
  private addUrlSchema = z.object({
    url: z.string().url().describe('The URL to add to history. Must be a valid URL format'),
  });

  private deleteAllSchema = z.object({});

  private deleteRangeSchema = z.object({
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
  });

  private deleteUrlSchema = z.object({
    url: z
      .string()
      .url()
      .describe(
        'The URL to remove from history. Must be in the format as returned from a call to history.search()'
      ),
  });

  private getVisitsSchema = z.object({
    url: z
      .string()
      .url()
      .describe(
        'The URL to get visit information for. Must be in the format as returned from a call to history.search()'
      ),
  });

  private searchSchema = z.object({
    text: z
      .string()
      .describe('A free-text query to the history service. Leave empty to retrieve all pages'),
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
  });
}
