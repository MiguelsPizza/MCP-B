import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface EnterpriseHardwarePlatformApiToolsOptions {
  getHardwarePlatformInfo?: boolean;
}

export class EnterpriseHardwarePlatformApiTools extends BaseApiTools {
  protected apiName = 'Enterprise.hardwarePlatform';

  constructor(server: McpServer, options: EnterpriseHardwarePlatformApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.enterprise || !chrome.enterprise.hardwarePlatform) {
        return {
          available: false,
          message: 'chrome.enterprise.hardwarePlatform API is not defined',
          details:
            'This extension needs the "enterprise.hardwarePlatform" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.enterprise.hardwarePlatform.getHardwarePlatformInfo !== 'function') {
        return {
          available: false,
          message: 'chrome.enterprise.hardwarePlatform.getHardwarePlatformInfo is not available',
          details:
            'The enterprise.hardwarePlatform API appears to be partially available. Check manifest permissions.',
        };
      }

      // Try to actually use the API
      chrome.enterprise.hardwarePlatform.getHardwarePlatformInfo((_info) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'Enterprise.hardwarePlatform API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.enterprise.hardwarePlatform API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('getHardwarePlatformInfo')) {
      this.registerGetHardwarePlatformInfo();
    }
  }

  private registerGetHardwarePlatformInfo(): void {
    this.server.registerTool(
      'get_hardware_platform_info',
      {
        description: 'Get hardware platform information for the device',
        inputSchema: {},
      },
      async () => {
        try {
          const info = await new Promise<chrome.enterprise.hardwarePlatform.HardwarePlatformInfo>(
            (resolve, reject) => {
              chrome.enterprise.hardwarePlatform.getHardwarePlatformInfo((info) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(info);
                }
              });
            }
          );

          return this.formatJson({
            manufacturer: info.manufacturer,
            model: info.model,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
