import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface DevtoolsNetworkApiToolsOptions {
  getHAR?: boolean;
  onNavigated?: boolean;
  onRequestFinished?: boolean;
}

export class DevtoolsNetworkApiTools extends BaseApiTools {
  protected apiName = 'Devtools.network';

  constructor(
    server: McpServer,
    options: DevtoolsNetworkApiToolsOptions = {}
  ) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.devtools || !chrome.devtools.network) {
        return {
          available: false,
          message: 'chrome.devtools.network API is not defined',
          details: 'This extension needs to be running in a devtools context and have the "devtools" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.devtools.network.getHAR !== 'function') {
        return {
          available: false,
          message: 'chrome.devtools.network.getHAR is not available',
          details: 'The devtools.network API appears to be partially available. Check manifest permissions and ensure running in devtools context.',
        };
      }

      // Try to actually use the API
      chrome.devtools.network.getHAR((_harLog) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'Devtools.network API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.devtools.network API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('getHAR')) {
      this.registerGetHAR();
    }

    if (this.shouldRegisterTool('onNavigated')) {
      this.registerOnNavigated();
    }

    if (this.shouldRegisterTool('onRequestFinished')) {
      this.registerOnRequestFinished();
    }
  }

  private registerGetHAR(): void {
    this.server.registerTool(
      'get_har',
      {
        description: 'Get the HTTP Archive (HAR) log for the current page, containing all network requests',
        inputSchema: {},
      },
      async () => {
        try {
          const harLog = await new Promise<chrome.devtools.network.HARLog>((resolve, reject) => {
            chrome.devtools.network.getHAR((harLog) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(harLog);
              }
            });
          });

          return this.formatJson({
            version: harLog.version,
            creator: harLog.creator,
            browser: harLog.browser,
            pages: harLog.pages?.map((page) => ({
              startedDateTime: page.startedDateTime,
              id: page.id,
              title: page.title,
              pageTimings: page.pageTimings,
            })),
            entries: harLog.entries?.map((entry) => ({
              startedDateTime: entry.startedDateTime,
              time: entry.time,
              request: {
                method: entry.request.method,
                url: entry.request.url,
                httpVersion: entry.request.httpVersion,
                headers: entry.request.headers,
                queryString: entry.request.queryString,
                postData: entry.request.postData,
                headersSize: entry.request.headersSize,
                bodySize: entry.request.bodySize,
              },
              response: {
                status: entry.response.status,
                statusText: entry.response.statusText,
                httpVersion: entry.response.httpVersion,
                headers: entry.response.headers,
                content: {
                  size: entry.response.content.size,
                  mimeType: entry.response.content.mimeType,
                  compression: entry.response.content.compression,
                },
                redirectURL: entry.response.redirectURL,
                headersSize: entry.response.headersSize,
                bodySize: entry.response.bodySize,
              },
              cache: entry.cache,
              timings: entry.timings,
              serverIPAddress: entry.serverIPAddress,
              connection: entry.connection,
            })),
            totalEntries: harLog.entries?.length || 0,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerOnNavigated(): void {
    this.server.registerTool(
      'on_navigated',
      {
        description: 'Set up a listener for navigation events in the inspected window',
        inputSchema: {
          enable: z.boolean().optional().describe('Whether to enable or disable the navigation listener'),
        },
      },
      async ({ enable = true }) => {
        try {
          if (enable) {
            const listener = (url: string) => {
              console.log('Navigation detected to:', url);
            };

            chrome.devtools.network.onNavigated.addListener(listener);

            return this.formatSuccess('Navigation listener enabled', {
              listening: true,
              event: 'onNavigated',
            });
          } else {
            chrome.devtools.network.onNavigated.removeListener(() => {});

            return this.formatSuccess('Navigation listener disabled', {
              listening: false,
              event: 'onNavigated',
            });
          }
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerOnRequestFinished(): void {
    this.server.registerTool(
      'on_request_finished',
      {
        description: 'Set up a listener for network request completion events',
        inputSchema: {
          enable: z.boolean().optional().describe('Whether to enable or disable the request finished listener'),
        },
      },
      async ({ enable = true }) => {
        try {
          if (enable) {
            const listener = (request: chrome.devtools.network.Request) => {
              console.log('Request finished:', {
                url: request.request.url,
                method: request.request.method,
                status: request.response.status,
                time: request.time,
              });
            };

            chrome.devtools.network.onRequestFinished.addListener(listener);

            return this.formatSuccess('Request finished listener enabled', {
              listening: true,
              event: 'onRequestFinished',
            });
          } else {
            chrome.devtools.network.onRequestFinished.removeListener(() => {});

            return this.formatSuccess('Request finished listener disabled', {
              listening: false,
              event: 'onRequestFinished',
            });
          }
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}