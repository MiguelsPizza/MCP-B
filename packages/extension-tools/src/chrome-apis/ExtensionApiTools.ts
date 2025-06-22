import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface ExtensionApiToolsOptions {
  getBackgroundPage?: boolean;
  getViews?: boolean;
  isAllowedFileSchemeAccess?: boolean;
  isAllowedIncognitoAccess?: boolean;
  setUpdateUrlData?: boolean;
}

export class ExtensionApiTools extends BaseApiTools {
  protected apiName = 'Extension';

  constructor(
    server: McpServer,
    options: ExtensionApiToolsOptions = {}
  ) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.extension) {
        return {
          available: false,
          message: 'chrome.extension API is not defined',
          details: 'This extension needs to be running in a Chrome extension context',
        };
      }

      // Test a basic method
      if (typeof chrome.extension.getViews !== 'function') {
        return {
          available: false,
          message: 'chrome.extension.getViews is not available',
          details: 'The extension API appears to be partially available. Check extension context.',
        };
      }

      // Try to actually use the API
      chrome.extension.getViews();

      return {
        available: true,
        message: 'Extension API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.extension API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('getBackgroundPage')) {
      this.registerGetBackgroundPage();
    }

    if (this.shouldRegisterTool('getViews')) {
      this.registerGetViews();
    }

    if (this.shouldRegisterTool('isAllowedFileSchemeAccess')) {
      this.registerIsAllowedFileSchemeAccess();
    }

    if (this.shouldRegisterTool('isAllowedIncognitoAccess')) {
      this.registerIsAllowedIncognitoAccess();
    }

    if (this.shouldRegisterTool('setUpdateUrlData')) {
      this.registerSetUpdateUrlData();
    }
  }

  private registerGetBackgroundPage(): void {
    this.server.registerTool(
      'get_background_page',
      {
        description: 'Returns the JavaScript window object for the background page running inside the current extension',
        inputSchema: {},
      },
      async () => {
        try {
          const backgroundPage = chrome.extension.getBackgroundPage();

          if (!backgroundPage) {
            return this.formatSuccess('No background page found', {
              hasBackgroundPage: false,
            });
          }

          return this.formatSuccess('Background page retrieved successfully', {
            hasBackgroundPage: true,
            location: backgroundPage.location.href,
            title: backgroundPage.document.title,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetViews(): void {
    this.server.registerTool(
      'get_views',
      {
        description: 'Returns an array of the JavaScript window objects for each of the pages running inside the current extension',
        inputSchema: {
          tabId: z
            .number()
            .optional()
            .describe('Find a view according to a tab id. If omitted, returns all views'),
          type: z
            .enum(['tab', 'popup'])
            .optional()
            .describe('The type of view to get. If omitted, returns all views including background pages and tabs'),
          windowId: z
            .number()
            .optional()
            .describe('The window to restrict the search to. If omitted, returns all views'),
        },
      },
      async ({ tabId, type, windowId }) => {
        try {
          const fetchProperties: any = {};
          
          if (tabId !== undefined) {
            fetchProperties.tabId = tabId;
          }
          
          if (type !== undefined) {
            fetchProperties.type = type;
          }
          
          if (windowId !== undefined) {
            fetchProperties.windowId = windowId;
          }

          const views = chrome.extension.getViews(Object.keys(fetchProperties).length > 0 ? fetchProperties : undefined);

          return this.formatJson({
            count: views.length,
            views: views.map((view, index) => ({
              index,
              location: view.location.href,
              title: view.document.title,
              isBackground: view === chrome.extension.getBackgroundPage(),
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerIsAllowedFileSchemeAccess(): void {
    this.server.registerTool(
      'is_allowed_file_scheme_access',
      {
        description: 'Retrieves the state of the extension\'s access to the file:// scheme. This corresponds to the user-controlled per-extension "Allow access to File URLs" setting',
        inputSchema: {},
      },
      async () => {
        try {
          const isAllowed = await new Promise<boolean>((resolve, reject) => {
            chrome.extension.isAllowedFileSchemeAccess((isAllowedAccess) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(isAllowedAccess);
              }
            });
          });

          return this.formatJson({
            isAllowedFileSchemeAccess: isAllowed,
            message: isAllowed 
              ? 'Extension has access to file:// URLs'
              : 'Extension does not have access to file:// URLs. This can be enabled in chrome://extensions',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerIsAllowedIncognitoAccess(): void {
    this.server.registerTool(
      'is_allowed_incognito_access',
      {
        description: 'Retrieves the state of the extension\'s access to Incognito-mode. This corresponds to the user-controlled per-extension "Allowed in Incognito" setting',
        inputSchema: {},
      },
      async () => {
        try {
          const isAllowed = await new Promise<boolean>((resolve, reject) => {
            chrome.extension.isAllowedIncognitoAccess((isAllowedAccess) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(isAllowedAccess);
              }
            });
          });

          return this.formatJson({
            isAllowedIncognitoAccess: isAllowed,
            inIncognitoContext: chrome.extension.inIncognitoContext,
            message: isAllowed 
              ? 'Extension has access to Incognito mode'
              : 'Extension does not have access to Incognito mode. This can be enabled in chrome://extensions',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetUpdateUrlData(): void {
    this.server.registerTool(
      'set_update_url_data',
      {
        description: 'Sets the value of the ap CGI parameter used in the extension\'s update URL. This value is ignored for extensions hosted in the Chrome Extension Gallery',
        inputSchema: {
          data: z
            .string()
            .describe('The data to set for the update URL parameter'),
        },
      },
      async ({ data }) => {
        try {
          chrome.extension.setUpdateUrlData(data);

          return this.formatSuccess('Update URL data set successfully', {
            data,
            note: 'This value is ignored for extensions hosted in the Chrome Extension Gallery',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}