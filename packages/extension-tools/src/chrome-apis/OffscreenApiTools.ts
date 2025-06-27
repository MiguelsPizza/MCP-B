import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface OffscreenApiToolsOptions {
  createDocument?: boolean;
  closeDocument?: boolean;
  hasOffscreenDocument?: boolean;
}

export class OffscreenApiTools extends BaseApiTools {
  protected apiName = 'Offscreen';

  constructor(server: McpServer, options: OffscreenApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.offscreen) {
        return {
          available: false,
          message: 'chrome.offscreen API is not defined',
          details: 'This extension needs the "offscreen" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.offscreen.createDocument !== 'function') {
        return {
          available: false,
          message: 'chrome.offscreen.createDocument is not available',
          details:
            'The offscreen API appears to be partially available. Check manifest permissions.',
        };
      }

      return {
        available: true,
        message: 'Offscreen API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.offscreen API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('createDocument')) {
      this.registerCreateDocument();
    }

    if (this.shouldRegisterTool('closeDocument')) {
      this.registerCloseDocument();
    }

    if (this.shouldRegisterTool('hasOffscreenDocument')) {
      this.registerHasOffscreenDocument();
    }
  }

  private registerCreateDocument(): void {
    this.server.registerTool(
      'extension_tool_create_offscreen_document',
      {
        description: 'Create a new offscreen document for the extension',
        inputSchema: {
          url: z.string().describe('The (relative) URL to load in the document'),
          reasons: z
            .array(
              z.enum([
                'TESTING',
                'AUDIO_PLAYBACK',
                'IFRAME_SCRIPTING',
                'DOM_SCRAPING',
                'BLOBS',
                'DOM_PARSER',
                'USER_MEDIA',
                'DISPLAY_MEDIA',
                'WEB_RTC',
                'CLIPBOARD',
                'LOCAL_STORAGE',
                'WORKERS',
                'BATTERY_STATUS',
                'MATCH_MEDIA',
                'GEOLOCATION',
              ])
            )
            .describe('The reason(s) the extension is creating the offscreen document'),
          justification: z
            .string()
            .describe(
              'A developer-provided string that explains, in more detail, the need for the background context'
            ),
        },
      },
      async ({ url, reasons, justification }) => {
        try {
          const parameters: chrome.offscreen.CreateParameters = {
            url,
            reasons: reasons as chrome.offscreen.Reason[],
            justification,
          };

          await new Promise<void>((resolve, reject) => {
            chrome.offscreen.createDocument(parameters, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Offscreen document created successfully', {
            url,
            reasons,
            justification,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerCloseDocument(): void {
    this.server.registerTool(
      'extension_tool_close_offscreen_document',
      {
        description: 'Close the currently-open offscreen document for the extension',
        inputSchema: {},
      },
      async () => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.offscreen.closeDocument(() => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Offscreen document closed successfully');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerHasOffscreenDocument(): void {
    this.server.registerTool(
      'extension_tool_has_offscreen_document',
      {
        description: 'Check if an offscreen document exists for the extension',
        inputSchema: {
          documentUrl: z
            .string()
            .optional()
            .describe('Optional specific document URL to check for'),
        },
      },
      async ({ documentUrl }) => {
        try {
          let hasDocument = false;
          let documentInfo = null;

          // Check if chrome.runtime.getContexts is available (Chrome 116+)
          if ('getContexts' in chrome.runtime) {
            const contextOptions: any = {
              contextTypes: ['OFFSCREEN_DOCUMENT'],
            };

            if (documentUrl) {
              contextOptions.documentUrls = [chrome.runtime.getURL(documentUrl)];
            }

            const contexts = await new Promise<chrome.runtime.ExtensionContext[]>(
              (resolve, reject) => {
                chrome.runtime.getContexts(contextOptions, (contexts) => {
                  if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                  } else {
                    resolve(contexts);
                  }
                });
              }
            );

            hasDocument = contexts.length > 0;
            if (hasDocument) {
              documentInfo = {
                count: contexts.length,
                contexts: contexts.map((context) => ({
                  contextType: context.contextType,
                  documentUrl: context.documentUrl,
                  frameId: context.frameId,
                  tabId: context.tabId,
                })),
              };
            }
          } else {
            // Fallback for Chrome versions before 116
            try {
              const matchedClients = await (self as any).clients.matchAll();
              hasDocument = matchedClients.some((client: any) => {
                const isOffscreenDoc = client.url.includes(chrome.runtime.id);
                if (documentUrl) {
                  return isOffscreenDoc && client.url.includes(documentUrl);
                }
                return isOffscreenDoc;
              });

              if (hasDocument) {
                documentInfo = {
                  method: 'clients.matchAll (legacy)',
                  note: 'Limited information available in Chrome versions before 116',
                };
              }
            } catch (clientsError) {
              // If clients API is not available, we can't determine the status
              return this.formatSuccess(
                'Cannot determine offscreen document status - clients API not available'
              );
            }
          }

          return this.formatJson({
            hasOffscreenDocument: hasDocument,
            documentInfo,
            checkedUrl: documentUrl || 'any',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
