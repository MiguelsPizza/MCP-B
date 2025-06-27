import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface WebNavigationApiToolsOptions {
  getAllFrames?: boolean;
  getFrame?: boolean;
  onBeforeNavigate?: boolean;
  onCommitted?: boolean;
  onCompleted?: boolean;
  onCreatedNavigationTarget?: boolean;
  onDOMContentLoaded?: boolean;
  onErrorOccurred?: boolean;
  onHistoryStateUpdated?: boolean;
  onReferenceFragmentUpdated?: boolean;
  onTabReplaced?: boolean;
}

export class WebNavigationApiTools extends BaseApiTools {
  protected apiName = 'WebNavigation';

  constructor(server: McpServer, options: WebNavigationApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.webNavigation) {
        return {
          available: false,
          message: 'chrome.webNavigation API is not defined',
          details: 'This extension needs the "webNavigation" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.webNavigation.getAllFrames !== 'function') {
        return {
          available: false,
          message: 'chrome.webNavigation.getAllFrames is not available',
          details:
            'The webNavigation API appears to be partially available. Check manifest permissions.',
        };
      }

      return {
        available: true,
        message: 'WebNavigation API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.webNavigation API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('getAllFrames')) {
      this.registerGetAllFrames();
    }

    if (this.shouldRegisterTool('getFrame')) {
      this.registerGetFrame();
    }

    if (this.shouldRegisterTool('onBeforeNavigate')) {
      this.registerOnBeforeNavigate();
    }

    if (this.shouldRegisterTool('onCommitted')) {
      this.registerOnCommitted();
    }

    if (this.shouldRegisterTool('onCompleted')) {
      this.registerOnCompleted();
    }

    if (this.shouldRegisterTool('onCreatedNavigationTarget')) {
      this.registerOnCreatedNavigationTarget();
    }

    if (this.shouldRegisterTool('onDOMContentLoaded')) {
      this.registerOnDOMContentLoaded();
    }

    if (this.shouldRegisterTool('onErrorOccurred')) {
      this.registerOnErrorOccurred();
    }

    if (this.shouldRegisterTool('onHistoryStateUpdated')) {
      this.registerOnHistoryStateUpdated();
    }

    if (this.shouldRegisterTool('onReferenceFragmentUpdated')) {
      this.registerOnReferenceFragmentUpdated();
    }

    if (this.shouldRegisterTool('onTabReplaced')) {
      this.registerOnTabReplaced();
    }
  }

  private registerGetAllFrames(): void {
    this.server.registerTool(
      'extension_tool_get_all_frames',
      {
        description: 'Retrieves information about all frames of a given tab',
        inputSchema: {
          tabId: z.number().describe('The ID of the tab to retrieve all frames from'),
        },
      },
      async ({ tabId }) => {
        try {
          const frames = await new Promise<
            chrome.webNavigation.GetAllFrameResultDetails[] | undefined
          >((resolve, reject) => {
            chrome.webNavigation.getAllFrames({ tabId }, (details) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(details ?? undefined);
              }
            });
          });

          if (!frames) {
            return this.formatError('Invalid tab ID or no frames found');
          }

          return this.formatJson({
            tabId,
            frameCount: frames.length,
            frames: frames.map((frame) => ({
              frameId: frame.frameId,
              parentFrameId: frame.parentFrameId,
              processId: frame.processId,
              url: frame.url,
              errorOccurred: frame.errorOccurred,
              documentId: frame.documentId,
              documentLifecycle: frame.documentLifecycle,
              frameType: frame.frameType,
              parentDocumentId: frame.parentDocumentId,
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetFrame(): void {
    this.server.registerTool(
      'extension_tool_get_frame',
      {
        description:
          'Retrieves information about the given frame. A frame refers to an iframe or frame of a web page',
        inputSchema: {
          tabId: z.number().optional().describe('The ID of the tab in which the frame is'),
          frameId: z.number().optional().describe('The ID of the frame in the given tab'),
        },
      },
      async ({ tabId, frameId }) => {
        try {
          const details: chrome.webNavigation.GetFrameDetails =
            {} as chrome.webNavigation.GetFrameDetails;

          if (tabId !== undefined) details.tabId = tabId;
          if (frameId !== undefined) details.frameId = frameId;

          const frame = await new Promise<chrome.webNavigation.GetFrameResultDetails | undefined>(
            (resolve, reject) => {
              chrome.webNavigation.getFrame(details, (frameDetails) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(frameDetails ?? undefined);
                }
              });
            }
          );

          if (!frame) {
            return this.formatSuccess('No frame found with the specified parameters');
          }

          return this.formatJson({
            parentFrameId: frame.parentFrameId,
            url: frame.url,
            errorOccurred: frame.errorOccurred,
            documentId: frame.documentId,
            documentLifecycle: frame.documentLifecycle,
            frameType: frame.frameType,
            parentDocumentId: frame.parentDocumentId,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerOnBeforeNavigate(): void {
    this.server.registerTool(
      'extension_tool_on_before_navigate',
      {
        description:
          'Sets up a listener for navigation events that are about to occur. Returns immediately after setting up the listener',
        inputSchema: {
          urlFilters: z
            .array(z.string())
            .optional()
            .describe(
              'URL patterns to filter navigation events. If not provided, listens to all navigations'
            ),
        },
      },
      async ({ urlFilters }) => {
        try {
          const filters = urlFilters
            ? { url: urlFilters.map((pattern) => ({ urlMatches: pattern })) }
            : undefined;

          chrome.webNavigation.onBeforeNavigate.addListener((details) => {
            console.log('Navigation about to occur:', {
              tabId: details.tabId,
              frameId: details.frameId,
              parentFrameId: details.parentFrameId,
              url: details.url,
              timeStamp: details.timeStamp,
              processId: details.processId,
              documentLifecycle: details.documentLifecycle,
              frameType: details.frameType,
              parentDocumentId: details.parentDocumentId,
            });
          }, filters);

          return this.formatSuccess('onBeforeNavigate listener registered successfully', {
            hasFilters: !!filters,
            filterCount: urlFilters?.length || 0,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerOnCommitted(): void {
    this.server.registerTool(
      'extension_tool_on_committed',
      {
        description:
          'Sets up a listener for navigation committed events. Fired when a navigation is committed',
        inputSchema: {
          urlFilters: z
            .array(z.string())
            .optional()
            .describe(
              'URL patterns to filter navigation events. If not provided, listens to all navigations'
            ),
        },
      },
      async ({ urlFilters }) => {
        try {
          const filters = urlFilters
            ? { url: urlFilters.map((pattern) => ({ urlMatches: pattern })) }
            : undefined;

          chrome.webNavigation.onCommitted.addListener((details) => {
            console.log('Navigation committed:', {
              tabId: details.tabId,
              frameId: details.frameId,
              url: details.url,
              timeStamp: details.timeStamp,
              processId: details.processId,
              transitionType: details.transitionType,
              transitionQualifiers: details.transitionQualifiers,
              documentId: details.documentId,
              documentLifecycle: details.documentLifecycle,
              frameType: details.frameType,
              parentDocumentId: details.parentDocumentId,
            });
          }, filters);

          return this.formatSuccess('onCommitted listener registered successfully', {
            hasFilters: !!filters,
            filterCount: urlFilters?.length || 0,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerOnCompleted(): void {
    this.server.registerTool(
      'extension_tool_on_completed',
      {
        description:
          'Sets up a listener for navigation completed events. Fired when a document and its resources are completely loaded',
        inputSchema: {
          urlFilters: z
            .array(z.string())
            .optional()
            .describe(
              'URL patterns to filter navigation events. If not provided, listens to all navigations'
            ),
        },
      },
      async ({ urlFilters }) => {
        try {
          const filters = urlFilters
            ? { url: urlFilters.map((pattern) => ({ urlMatches: pattern })) }
            : undefined;

          chrome.webNavigation.onCompleted.addListener((details) => {
            console.log('Navigation completed:', {
              tabId: details.tabId,
              frameId: details.frameId,
              url: details.url,
              timeStamp: details.timeStamp,
              processId: details.processId,
              documentId: details.documentId,
              documentLifecycle: details.documentLifecycle,
              frameType: details.frameType,
              parentDocumentId: details.parentDocumentId,
            });
          }, filters);

          return this.formatSuccess('onCompleted listener registered successfully', {
            hasFilters: !!filters,
            filterCount: urlFilters?.length || 0,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerOnCreatedNavigationTarget(): void {
    this.server.registerTool(
      'extension_tool_on_created_navigation_target',
      {
        description:
          'Sets up a listener for new navigation target creation events. Fired when a new window or tab is created to host a navigation',
        inputSchema: {
          urlFilters: z
            .array(z.string())
            .optional()
            .describe(
              'URL patterns to filter navigation events. If not provided, listens to all navigations'
            ),
        },
      },
      async ({ urlFilters }) => {
        try {
          const filters = urlFilters
            ? { url: urlFilters.map((pattern) => ({ urlMatches: pattern })) }
            : undefined;

          chrome.webNavigation.onCreatedNavigationTarget.addListener((details) => {
            console.log('Navigation target created:', {
              sourceTabId: details.sourceTabId,
              sourceFrameId: details.sourceFrameId,
              sourceProcessId: details.sourceProcessId,
              tabId: details.tabId,
              url: details.url,
              timeStamp: details.timeStamp,
            });
          }, filters);

          return this.formatSuccess('onCreatedNavigationTarget listener registered successfully', {
            hasFilters: !!filters,
            filterCount: urlFilters?.length || 0,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerOnDOMContentLoaded(): void {
    this.server.registerTool(
      'extension_tool_on_dom_content_loaded',
      {
        description:
          'Sets up a listener for DOM content loaded events. Fired when the page DOM is fully constructed',
        inputSchema: {
          urlFilters: z
            .array(z.string())
            .optional()
            .describe(
              'URL patterns to filter navigation events. If not provided, listens to all navigations'
            ),
        },
      },
      async ({ urlFilters }) => {
        try {
          const filters = urlFilters
            ? { url: urlFilters.map((pattern) => ({ urlMatches: pattern })) }
            : undefined;

          chrome.webNavigation.onDOMContentLoaded.addListener((details) => {
            console.log('DOM content loaded:', {
              tabId: details.tabId,
              frameId: details.frameId,
              url: details.url,
              timeStamp: details.timeStamp,
              processId: details.processId,
              documentId: details.documentId,
              documentLifecycle: details.documentLifecycle,
              frameType: details.frameType,
              parentDocumentId: details.parentDocumentId,
            });
          }, filters);

          return this.formatSuccess('onDOMContentLoaded listener registered successfully', {
            hasFilters: !!filters,
            filterCount: urlFilters?.length || 0,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerOnErrorOccurred(): void {
    this.server.registerTool(
      'extension_tool_on_error_occurred',
      {
        description:
          'Sets up a listener for navigation error events. Fired when an error occurs and navigation is aborted',
        inputSchema: {
          urlFilters: z
            .array(z.string())
            .optional()
            .describe(
              'URL patterns to filter navigation events. If not provided, listens to all navigations'
            ),
        },
      },
      async ({ urlFilters }) => {
        try {
          const filters = urlFilters
            ? { url: urlFilters.map((pattern) => ({ urlMatches: pattern })) }
            : undefined;

          chrome.webNavigation.onErrorOccurred.addListener((details) => {
            console.log('Navigation error occurred:', {
              tabId: details.tabId,
              frameId: details.frameId,
              url: details.url,
              error: details.error,
              timeStamp: details.timeStamp,
              processId: details.processId,
              documentId: details.documentId,
              documentLifecycle: details.documentLifecycle,
              frameType: details.frameType,
              parentDocumentId: details.parentDocumentId,
            });
          }, filters);

          return this.formatSuccess('onErrorOccurred listener registered successfully', {
            hasFilters: !!filters,
            filterCount: urlFilters?.length || 0,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerOnHistoryStateUpdated(): void {
    this.server.registerTool(
      'extension_tool_on_history_state_updated',
      {
        description:
          'Sets up a listener for history state update events. Fired when the frame history was updated to a new URL',
        inputSchema: {
          urlFilters: z
            .array(z.string())
            .optional()
            .describe(
              'URL patterns to filter navigation events. If not provided, listens to all navigations'
            ),
        },
      },
      async ({ urlFilters }) => {
        try {
          const filters = urlFilters
            ? { url: urlFilters.map((pattern) => ({ urlMatches: pattern })) }
            : undefined;

          chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
            console.log('History state updated:', {
              tabId: details.tabId,
              frameId: details.frameId,
              url: details.url,
              timeStamp: details.timeStamp,
              processId: details.processId,
              transitionType: details.transitionType,
              transitionQualifiers: details.transitionQualifiers,
              documentId: details.documentId,
              documentLifecycle: details.documentLifecycle,
              frameType: details.frameType,
              parentDocumentId: details.parentDocumentId,
            });
          }, filters);

          return this.formatSuccess('onHistoryStateUpdated listener registered successfully', {
            hasFilters: !!filters,
            filterCount: urlFilters?.length || 0,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerOnReferenceFragmentUpdated(): void {
    this.server.registerTool(
      'extension_tool_on_reference_fragment_updated',
      {
        description:
          'Sets up a listener for reference fragment update events. Fired when the reference fragment of a frame was updated',
        inputSchema: {
          urlFilters: z
            .array(z.string())
            .optional()
            .describe(
              'URL patterns to filter navigation events. If not provided, listens to all navigations'
            ),
        },
      },
      async ({ urlFilters }) => {
        try {
          const filters = urlFilters
            ? { url: urlFilters.map((pattern) => ({ urlMatches: pattern })) }
            : undefined;

          chrome.webNavigation.onReferenceFragmentUpdated.addListener((details) => {
            console.log('Reference fragment updated:', {
              tabId: details.tabId,
              frameId: details.frameId,
              url: details.url,
              timeStamp: details.timeStamp,
              processId: details.processId,
              transitionType: details.transitionType,
              transitionQualifiers: details.transitionQualifiers,
              documentId: details.documentId,
              documentLifecycle: details.documentLifecycle,
              frameType: details.frameType,
              parentDocumentId: details.parentDocumentId,
            });
          }, filters);

          return this.formatSuccess('onReferenceFragmentUpdated listener registered successfully', {
            hasFilters: !!filters,
            filterCount: urlFilters?.length || 0,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerOnTabReplaced(): void {
    this.server.registerTool(
      'extension_tool_on_tab_replaced',
      {
        description:
          'Sets up a listener for tab replacement events. Fired when the contents of a tab is replaced by a different tab',
        inputSchema: {},
      },
      async () => {
        try {
          chrome.webNavigation.onTabReplaced.addListener((details) => {
            console.log('Tab replaced:', {
              replacedTabId: details.replacedTabId,
              tabId: details.tabId,
              timeStamp: details.timeStamp,
            });
          });

          return this.formatSuccess('onTabReplaced listener registered successfully');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
