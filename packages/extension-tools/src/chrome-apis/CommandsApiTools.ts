import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { type ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface CommandsApiToolsOptions {
  getAll?: boolean;
}

export class CommandsApiTools extends BaseApiTools {
  protected apiName = 'Commands';

  constructor(server: McpServer, options: CommandsApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.commands) {
        return {
          available: false,
          message: 'chrome.commands API is not defined',
          details: 'This extension needs the "commands" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.commands.getAll !== 'function') {
        return {
          available: false,
          message: 'chrome.commands.getAll is not available',
          details:
            'The commands API appears to be partially available. Check manifest permissions.',
        };
      }

      // Try to actually use the API
      chrome.commands.getAll((_commands) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'Commands API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.commands API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('getAll')) {
      this.registerGetAll();
    }
  }

  private registerGetAll(): void {
    this.server.registerTool(
      'extension_tool_get_all_commands',
      {
        description: 'Get all registered extension commands and their keyboard shortcuts',
        inputSchema: {},
      },
      async () => {
        try {
          const commands = await new Promise<chrome.commands.Command[]>((resolve, reject) => {
            chrome.commands.getAll((commands) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(commands);
              }
            });
          });

          return this.formatJson({
            count: commands.length,
            commands: commands.map((command) => ({
              name: command.name,
              description: command.description,
              shortcut: command.shortcut || 'Not assigned',
              isActive: !!command.shortcut,
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
