import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface FileBrowserHandlerApiToolsOptions {
  getExecuteEventDetails?: boolean;
  addExecuteListener?: boolean;
  removeExecuteListener?: boolean;
}

export class FileBrowserHandlerApiTools extends BaseApiTools {
  protected apiName = 'FileBrowserHandler';

  constructor(server: McpServer, options: FileBrowserHandlerApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.fileBrowserHandler) {
        return {
          available: false,
          message: 'chrome.fileBrowserHandler API is not defined',
          details:
            'This extension needs the "fileBrowserHandler" permission in its manifest.json and must be running on ChromeOS',
        };
      }

      // Test a basic method
      if (
        typeof chrome.fileBrowserHandler.onExecute !== 'object' ||
        typeof chrome.fileBrowserHandler.onExecute.addListener !== 'function'
      ) {
        return {
          available: false,
          message: 'chrome.fileBrowserHandler.onExecute is not available',
          details:
            'The fileBrowserHandler API appears to be partially available. Check manifest permissions and ensure running on ChromeOS.',
        };
      }

      // Check if we're on ChromeOS
      if (!navigator.userAgent.includes('CrOS')) {
        return {
          available: false,
          message: 'FileBrowserHandler API is only available on ChromeOS',
          details:
            'This API requires ChromeOS and proper file_browser_handlers configuration in manifest.json',
        };
      }

      return {
        available: true,
        message: 'FileBrowserHandler API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.fileBrowserHandler API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('getExecuteEventDetails')) {
      this.registerGetExecuteEventDetails();
    }

    if (this.shouldRegisterTool('addExecuteListener')) {
      this.registerAddExecuteListener();
    }

    if (this.shouldRegisterTool('removeExecuteListener')) {
      this.registerRemoveExecuteListener();
    }
  }

  private registerGetExecuteEventDetails(): void {
    this.server.registerTool(
      'extension_tool_get_execute_event_details',
      {
        description:
          'Get information about the current file browser handler execute event details structure',
        inputSchema: {},
      },
      async () => {
        try {
          return this.formatJson({
            eventStructure: {
              id: 'string - The id value from the manifest file',
              details: {
                entries: 'FileSystemFileEntry[] - Array of selected file entries',
                tab_id: 'number (optional) - The ID of the tab that raised this event',
              },
            },
            usage: 'Use addExecuteListener to register a handler for file browser execute events',
            note: 'This API only works on ChromeOS and requires file_browser_handlers in manifest.json',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerAddExecuteListener(): void {
    this.server.registerTool(
      'extension_tool_add_execute_listener',
      {
        description:
          'Add a listener for file browser handler execute events. This will log events when users execute file browser actions.',
        inputSchema: {
          logEvents: z
            .boolean()
            .optional()
            .default(true)
            .describe('Whether to log execute events to console'),
        },
      },
      async ({ logEvents }) => {
        try {
          // Create a listener function
          const listener = (
            id: string,
            details: chrome.fileBrowserHandler.FileHandlerExecuteEventDetails
          ) => {
            if (logEvents) {
              console.log('FileBrowserHandler execute event:', {
                id,
                entriesCount: details.entries?.length || 0,
                tabId: details.tab_id,
                timestamp: new Date().toISOString(),
              });
            }
          };

          // Add the listener
          chrome.fileBrowserHandler.onExecute.addListener(listener);

          return this.formatSuccess('Execute event listener added successfully', {
            listenerAdded: true,
            loggingEnabled: logEvents,
            note: 'Events will be triggered when users execute file browser actions',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerRemoveExecuteListener(): void {
    this.server.registerTool(
      'extension_tool_remove_execute_listener',
      {
        description: 'Remove all execute event listeners for file browser handler',
        inputSchema: {},
      },
      async () => {
        try {
          // Check if there are any listeners
          const hasListeners = chrome.fileBrowserHandler.onExecute.hasListeners();

          // Remove all listeners
          chrome.fileBrowserHandler.onExecute.removeListener;

          return this.formatSuccess('Execute event listeners removed', {
            hadListeners: hasListeners,
            listenersRemoved: true,
            note: 'All execute event listeners have been removed',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
