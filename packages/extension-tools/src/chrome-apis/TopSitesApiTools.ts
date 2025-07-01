import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { type ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface TopSitesApiToolsOptions {
  getTopSites?: boolean;
}

export class TopSitesApiTools extends BaseApiTools {
  protected apiName = 'TopSites';

  constructor(server: McpServer, options: TopSitesApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.topSites) {
        return {
          available: false,
          message: 'chrome.topSites API is not defined',
          details: 'This extension needs the "topSites" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.topSites.get !== 'function') {
        return {
          available: false,
          message: 'chrome.topSites.get is not available',
          details:
            'The topSites API appears to be partially available. Check manifest permissions.',
        };
      }

      // Try to actually use the API
      chrome.topSites.get((_topSites) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'TopSites API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.topSites API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('getTopSites')) {
      this.registerGetTopSites();
    }
  }

  private registerGetTopSites(): void {
    this.server.registerTool(
      'extension_tool_get_top_sites',
      {
        description:
          'Get a list of top sites (most visited sites) that are displayed on the new tab page',
        inputSchema: {},
      },
      async () => {
        try {
          const topSites = await new Promise<chrome.topSites.MostVisitedURL[]>(
            (resolve, reject) => {
              chrome.topSites.get((topSites) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(topSites);
                }
              });
            }
          );

          return this.formatJson({
            count: topSites.length,
            topSites: topSites.map((site) => ({
              title: site.title,
              url: site.url,
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
