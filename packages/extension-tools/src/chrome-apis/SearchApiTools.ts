import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { type ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface SearchApiToolsOptions {
  query?: boolean;
}

export class SearchApiTools extends BaseApiTools {
  protected apiName = 'Search';

  constructor(server: McpServer, options: SearchApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.search) {
        return {
          available: false,
          message: 'chrome.search API is not defined',
          details: 'This extension needs the "search" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.search.query !== 'function') {
        return {
          available: false,
          message: 'chrome.search.query is not available',
          details: 'The search API appears to be partially available. Check manifest permissions.',
        };
      }

      return {
        available: true,
        message: 'Search API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.search API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('query')) {
      this.registerQuery();
    }
  }

  private registerQuery(): void {
    this.server.registerTool(
      'extension_tool_search_query',
      {
        description: 'Search using the default search provider',
        inputSchema: {
          text: z.string().describe('String to query with the default search provider'),
          disposition: z
            .enum(['CURRENT_TAB', 'NEW_TAB', 'NEW_WINDOW'])
            .optional()
            .describe(
              'Location where search results should be displayed. CURRENT_TAB is the default'
            ),
          tabId: z
            .number()
            .optional()
            .describe(
              'Tab ID where search results should be displayed. Cannot be used with disposition'
            ),
        },
      },
      async ({ text, disposition, tabId }) => {
        try {
          // Validate that disposition and tabId are not both specified
          if (disposition !== undefined && tabId !== undefined) {
            return this.formatError(
              'Cannot specify both disposition and tabId. Use one or the other'
            );
          }

          // Build query info
          const queryInfo: chrome.search.QueryInfo = {
            text: text,
          };

          if (disposition !== undefined) {
            queryInfo.disposition = disposition;
          }

          if (tabId !== undefined) {
            queryInfo.tabId = tabId;
          }

          // Execute the search
          await new Promise<void>((resolve, reject) => {
            chrome.search.query(queryInfo, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Search query executed successfully', {
            text: text,
            disposition: disposition || 'CURRENT_TAB',
            tabId: tabId,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
