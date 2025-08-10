import {
  type BookmarksApiToolsOptions,
  type HistoryApiToolsOptions,
  ScriptingApiTools,
  type ScriptingApiToolsOptions,
  type StorageApiToolsOptions,
  type TabGroupsApiToolsOptions,
  TabsApiTools,
  type TabsApiToolsOptions,
  type WindowsApiToolsOptions,
} from '@mcp-b/extension-tools';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { UserScriptTools, UserScriptToolsOptions } from '../models/aiCRUD/UserScriptTools';

// I know this seems unMaintainable but having all the sub methods redefined is eaiser for AI
export interface ExtensionToolsOptions {
  bookmarks?: BookmarksApiToolsOptions;
  history?: HistoryApiToolsOptions;
  storage?: StorageApiToolsOptions;
  tabs?: TabsApiToolsOptions;
  windows?: WindowsApiToolsOptions;
  scripting?: ScriptingApiToolsOptions;
  tabGroups?: TabGroupsApiToolsOptions;
  userScriptTools?: UserScriptToolsOptions;
}

/**
 * Service that registers extension-specific tools with the MCP server.
 * These tools provide access to Chrome Extension APIs available in the background service worker.
 */
export class ExtensionToolsService {
  private apiTools: any[] = [];

  constructor(
    private server: McpServer,
    private options: ExtensionToolsOptions = {}
  ) {
    this.initializeApiTools();
  }

  private initializeApiTools(): void {
    // Initialize all API tool classes
    this.apiTools = [
      // new BookmarksApiTools(this.server, this.options.bookmarks),
      // new StorageApiTools(this.server, this.options.storage),
      // new HistoryApiTools(this.server, this.options.history),
      // new TabGroupsApiTools(this.server, this.options.tabGroups),
      new TabsApiTools(this.server, this.options.tabs),
      new UserScriptTools(this.server, this.options.userScriptTools),
      // new WindowsApiTools(this.server, this.options.windows),
      new ScriptingApiTools(this.server, this.options.scripting),
    ];
  }

  /**
   * Get a summary of available Chrome APIs
   */
  getAvailableApis(): Record<string, any> {
    const apiStatuses: Record<string, any> = {};

    for (const tool of this.apiTools) {
      const availability = tool.checkAvailability();
      apiStatuses[tool.apiName.toLowerCase()] = {
        available: availability.available,
        message: availability.message,
        details: availability.details,
      };
    }

    return apiStatuses;
  }

  /**
   * Register all extension-specific tools with the MCP server
   * Only registers tools for APIs that are available (have proper permissions)
   */
  registerAllTools() {
    console.log('Registering extension tools...');

    // Always register the API check tool
    this.registerApiCheckTool();

    // Register all API tools
    for (const tool of this.apiTools) {
      tool.register();
    }
  }

  private registerApiCheckTool() {
    // Check available Chrome APIs
    this.server.registerTool(
      'extension_tool_check_available_apis',
      {
        description: 'Check which Chrome Extension APIs are available to the extension',
        inputSchema: {},
      },
      async () => {
        const apis = this.getAvailableApis();
        let permissions = null;

        // Only try to get permissions if the API is available
        if (chrome.permissions && typeof chrome.permissions.getAll === 'function') {
          try {
            permissions = await chrome.permissions.getAll();
          } catch (error) {
            console.error('Failed to get permissions:', error);
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  availableApis: apis,
                  permissions: permissions
                    ? {
                        permissions: permissions.permissions || [],
                        origins: permissions.origins || [],
                      }
                    : 'Permissions API not available',
                },
                null,
                2
              ),
            },
          ],
        };
      }
    );
  }
}
