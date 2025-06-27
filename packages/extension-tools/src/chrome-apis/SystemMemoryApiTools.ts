import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface SystemMemoryApiToolsOptions {
  getInfo?: boolean;
}

export class SystemMemoryApiTools extends BaseApiTools {
  protected apiName = 'System.memory';

  constructor(server: McpServer, options: SystemMemoryApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.system || !chrome.system.memory) {
        return {
          available: false,
          message: 'chrome.system.memory API is not defined',
          details: 'This extension needs the "system.memory" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.system.memory.getInfo !== 'function') {
        return {
          available: false,
          message: 'chrome.system.memory.getInfo is not available',
          details:
            'The system.memory API appears to be partially available. Check manifest permissions.',
        };
      }

      // Try to actually use the API
      chrome.system.memory.getInfo((_info) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'System.memory API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.system.memory API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('getInfo')) {
      this.registerGetInfo();
    }
  }

  private registerGetInfo(): void {
    this.server.registerTool(
      'extension_tool_get_memory_info',
      {
        description: 'Get information about the system memory',
        inputSchema: {},
      },
      async () => {
        try {
          const memoryInfo = await new Promise<chrome.system.memory.MemoryInfo>(
            (resolve, reject) => {
              chrome.system.memory.getInfo((info) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(info);
                }
              });
            }
          );

          return this.formatJson({
            capacity: memoryInfo.capacity,
            capacityGB: Math.round((memoryInfo.capacity / (1024 * 1024 * 1024)) * 100) / 100,
            availableCapacity: memoryInfo.availableCapacity,
            availableCapacityGB:
              Math.round((memoryInfo.availableCapacity / (1024 * 1024 * 1024)) * 100) / 100,
            usedCapacity: memoryInfo.capacity - memoryInfo.availableCapacity,
            usedCapacityGB:
              Math.round(
                ((memoryInfo.capacity - memoryInfo.availableCapacity) / (1024 * 1024 * 1024)) * 100
              ) / 100,
            usagePercentage:
              Math.round(
                ((memoryInfo.capacity - memoryInfo.availableCapacity) / memoryInfo.capacity) * 10000
              ) / 100,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
