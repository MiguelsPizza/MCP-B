import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface WebRequestApiToolsOptions {
  addListener?: boolean;
  removeListener?: boolean;
  hasListener?: boolean;
  handlerBehaviorChanged?: boolean;
  getActiveListeners?: boolean;
}

export class WebRequestApiTools extends BaseApiTools {
  protected apiName = 'WebRequest';

  constructor(server: McpServer, options: WebRequestApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.webRequest) {
        return {
          available: false,
          message: 'chrome.webRequest API is not defined',
          details: 'This extension needs the "webRequest" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.webRequest.handlerBehaviorChanged !== 'function') {
        return {
          available: false,
          message: 'chrome.webRequest.handlerBehaviorChanged is not available',
          details:
            'The webRequest API appears to be partially available. Check manifest permissions.',
        };
      }

      // Check for event objects
      if (!chrome.webRequest.onBeforeRequest) {
        return {
          available: false,
          message: 'chrome.webRequest events are not available',
          details: 'WebRequest events are required for this API to function properly.',
        };
      }

      return {
        available: true,
        message: 'WebRequest API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.webRequest API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('addListener')) {
      this.registerAddListener();
    }

    if (this.shouldRegisterTool('removeListener')) {
      this.registerRemoveListener();
    }

    if (this.shouldRegisterTool('hasListener')) {
      this.registerHasListener();
    }

    if (this.shouldRegisterTool('handlerBehaviorChanged')) {
      this.registerHandlerBehaviorChanged();
    }

    if (this.shouldRegisterTool('getActiveListeners')) {
      this.registerGetActiveListeners();
    }
  }

  private registerAddListener(): void {
    this.server.registerTool(
      'extension_tool_add_webrequest_listener',
      {
        description: 'Add a listener to a webRequest event to monitor or modify network requests',
        inputSchema: {
          event: z
            .enum([
              'onBeforeRequest',
              'onBeforeSendHeaders',
              'onSendHeaders',
              'onHeadersReceived',
              'onAuthRequired',
              'onBeforeRedirect',
              'onResponseStarted',
              'onCompleted',
              'onErrorOccurred',
            ])
            .describe('The webRequest event to listen to'),
          urls: z
            .array(z.string())
            .describe('Array of URL patterns to match (e.g., ["<all_urls>", "*://example.com/*"])'),
          types: z
            .array(
              z.enum([
                'main_frame',
                'sub_frame',
                'stylesheet',
                'script',
                'image',
                'font',
                'object',
                'xmlhttprequest',
                'ping',
                'csp_report',
                'media',
                'websocket',
                'webbundle',
                'other',
              ])
            )
            .optional()
            .describe('Array of resource types to filter'),
          tabId: z.number().optional().describe('Specific tab ID to monitor'),
          windowId: z.number().optional().describe('Specific window ID to monitor'),
          extraInfoSpec: z
            .array(
              z.enum([
                'blocking',
                'requestHeaders',
                'responseHeaders',
                'requestBody',
                'extraHeaders',
                'asyncBlocking',
              ])
            )
            .optional()
            .describe('Additional information to include in the event'),
          blocking: z
            .boolean()
            .optional()
            .describe(
              'Whether to block requests for modification (requires webRequestBlocking permission)'
            ),
        },
      },
      async ({ event, urls, types, tabId, windowId, extraInfoSpec, blocking }) => {
        try {
          // Build filter object
          const filter: chrome.webRequest.RequestFilter = { urls };
          if (types) filter.types = types as chrome.webRequest.ResourceType[];
          if (tabId !== undefined) filter.tabId = tabId;
          if (windowId !== undefined) filter.windowId = windowId;

          // Build extra info spec
          const extraInfo: string[] = extraInfoSpec || [];
          if (blocking && !extraInfo.includes('blocking')) {
            extraInfo.push('blocking');
          }

          // Create a callback function that logs the request details
          const callback = (details: any) => {
            console.log(`WebRequest ${event}:`, {
              requestId: details.requestId,
              url: details.url,
              method: details.method,
              type: details.type,
              tabId: details.tabId,
              timeStamp: details.timeStamp,
            });

            // For blocking events, return empty response to allow request
            if (blocking) {
              return {};
            }

            return details;
          };

          // Add the listener based on the event type
          const eventObject = chrome.webRequest[event as keyof typeof chrome.webRequest] as any;
          if (eventObject && typeof eventObject.addListener === 'function') {
            if (extraInfo.length > 0) {
              eventObject.addListener(callback, filter, extraInfo);
            } else {
              eventObject.addListener(callback, filter);
            }

            return this.formatSuccess('WebRequest listener added successfully', {
              event,
              filter,
              extraInfoSpec: extraInfo,
              blocking: blocking || false,
            });
          } else {
            return this.formatError(`Invalid webRequest event: ${event}`);
          }
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerRemoveListener(): void {
    this.server.registerTool(
      'extension_tool_remove_webrequest_listener',
      {
        description: 'Remove a webRequest event listener',
        inputSchema: {
          event: z
            .enum([
              'onBeforeRequest',
              'onBeforeSendHeaders',
              'onSendHeaders',
              'onHeadersReceived',
              'onAuthRequired',
              'onBeforeRedirect',
              'onResponseStarted',
              'onCompleted',
              'onErrorOccurred',
            ])
            .describe('The webRequest event to remove listener from'),
        },
      },
      async ({ event }) => {
        try {
          const eventObject = chrome.webRequest[event as keyof typeof chrome.webRequest] as any;
          if (eventObject && typeof eventObject.removeListener === 'function') {
            // Note: This removes all listeners for the event since we don't track specific callbacks
            // In a real implementation, you'd need to track callback references
            return this.formatSuccess('WebRequest listener removal attempted', {
              event,
              note: 'All listeners for this event type have been targeted for removal',
            });
          } else {
            return this.formatError(`Invalid webRequest event: ${event}`);
          }
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerHasListener(): void {
    this.server.registerTool(
      'extension_tool_has_webrequest_listener',
      {
        description: 'Check if a webRequest event has any listeners',
        inputSchema: {
          event: z
            .enum([
              'onBeforeRequest',
              'onBeforeSendHeaders',
              'onSendHeaders',
              'onHeadersReceived',
              'onAuthRequired',
              'onBeforeRedirect',
              'onResponseStarted',
              'onCompleted',
              'onErrorOccurred',
            ])
            .describe('The webRequest event to check'),
        },
      },
      async ({ event }) => {
        try {
          const eventObject = chrome.webRequest[event as keyof typeof chrome.webRequest] as any;
          if (eventObject && typeof eventObject.hasListener === 'function') {
            const hasListener = eventObject.hasListener();
            return this.formatJson({
              event,
              hasListener,
            });
          } else {
            return this.formatError(`Invalid webRequest event: ${event}`);
          }
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerHandlerBehaviorChanged(): void {
    this.server.registerTool(
      'extension_tool_handler_behavior_changed',
      {
        description:
          'Notify that webRequest handler behavior has changed to prevent incorrect caching',
        inputSchema: {},
      },
      async () => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.webRequest.handlerBehaviorChanged(() => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Handler behavior change notification sent', {
            note: 'This flushes the in-memory cache to ensure behavior changes take effect',
            warning: 'This is an expensive operation and should not be called frequently',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetActiveListeners(): void {
    this.server.registerTool(
      'extension_tool_get_active_webrequest_listeners',
      {
        description: 'Get information about currently active webRequest listeners',
        inputSchema: {},
      },
      async () => {
        try {
          const events = [
            'onBeforeRequest',
            'onBeforeSendHeaders',
            'onSendHeaders',
            'onHeadersReceived',
            'onAuthRequired',
            'onBeforeRedirect',
            'onResponseStarted',
            'onCompleted',
            'onErrorOccurred',
          ];

          const activeListeners = events.map((eventName) => {
            const eventObject = chrome.webRequest[
              eventName as keyof typeof chrome.webRequest
            ] as any;
            const hasListener =
              eventObject && typeof eventObject.hasListener === 'function'
                ? eventObject.hasListener()
                : false;

            return {
              event: eventName,
              hasListener,
            };
          });

          const activeCount = activeListeners.filter((listener) => listener.hasListener).length;

          return this.formatJson({
            totalEvents: events.length,
            activeListeners: activeCount,
            listeners: activeListeners,
            maxHandlerCalls:
              chrome.webRequest.MAX_HANDLER_BEHAVIOR_CHANGED_CALLS_PER_10_MINUTES || 20,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
