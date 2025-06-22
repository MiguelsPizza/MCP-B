import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface SystemCpuApiToolsOptions {
  getInfo?: boolean;
}

export class SystemCpuApiTools extends BaseApiTools {
  protected apiName = 'System.cpu';

  constructor(server: McpServer, options: SystemCpuApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.system || !chrome.system.cpu) {
        return {
          available: false,
          message: 'chrome.system.cpu API is not defined',
          details: 'This extension needs the "system.cpu" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.system.cpu.getInfo !== 'function') {
        return {
          available: false,
          message: 'chrome.system.cpu.getInfo is not available',
          details:
            'The system.cpu API appears to be partially available. Check manifest permissions.',
        };
      }

      // Try to actually use the API
      chrome.system.cpu.getInfo((_info) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'System.cpu API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.system.cpu API',
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
      'get_cpu_info',
      {
        description:
          'Get information about the CPU including number of processors, architecture, model, and features',
        inputSchema: {},
      },
      async () => {
        try {
          const cpuInfo = await new Promise<chrome.system.cpu.CpuInfo>((resolve, reject) => {
            chrome.system.cpu.getInfo((info) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(info);
              }
            });
          });

          return this.formatJson({
            numOfProcessors: cpuInfo.numOfProcessors,
            archName: cpuInfo.archName,
            modelName: cpuInfo.modelName,
            features: cpuInfo.features,
            processors: cpuInfo.processors.map((processor) => ({
              usage: {
                kernel: processor.usage.kernel,
                user: processor.usage.user,
                idle: processor.usage.idle,
                total: processor.usage.total,
              },
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
