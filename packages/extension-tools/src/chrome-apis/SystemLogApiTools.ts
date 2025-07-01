import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { type ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface SystemLogApiToolsOptions {
  addLog?: boolean;
}

export class SystemLogApiTools extends BaseApiTools {
  protected apiName = 'SystemLog';

  constructor(server: McpServer, options: SystemLogApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.systemLog) {
        return {
          available: false,
          message: 'chrome.systemLog API is not defined',
          details:
            'This extension needs the "systemLog" permission in its manifest.json and must run on ChromeOS',
        };
      }

      // Test a basic method
      if (typeof chrome.systemLog.add !== 'function') {
        return {
          available: false,
          message: 'chrome.systemLog.add is not available',
          details:
            'The systemLog API appears to be partially available. Check manifest permissions and ensure running on ChromeOS.',
        };
      }

      return {
        available: true,
        message: 'SystemLog API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.systemLog API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('addLog')) {
      this.registerAddLog();
    }
  }

  private registerAddLog(): void {
    this.server.registerTool(
      'extension_tool_add_log',
      {
        description: 'Add a new log record to the Chrome system logs',
        inputSchema: {
          message: z.string().describe('The log message to record in the system logs'),
        },
      },
      async ({ message }) => {
        try {
          const options: chrome.systemLog.MessageOptions = {
            message: message,
          };

          await new Promise<void>((resolve, reject) => {
            chrome.systemLog.add(options, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Log record added successfully', {
            message: message,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
