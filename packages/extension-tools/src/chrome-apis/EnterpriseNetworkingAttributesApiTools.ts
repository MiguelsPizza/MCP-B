import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface EnterpriseNetworkingAttributesApiToolsOptions {
  getNetworkDetails?: boolean;
}

export class EnterpriseNetworkingAttributesApiTools extends BaseApiTools {
  protected apiName = 'Enterprise.networkingAttributes';

  constructor(server: McpServer, options: EnterpriseNetworkingAttributesApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.enterprise || !chrome.enterprise.networkingAttributes) {
        return {
          available: false,
          message: 'chrome.enterprise.networkingAttributes API is not defined',
          details:
            'This extension needs the "enterprise.networkingAttributes" permission in its manifest.json and must run on ChromeOS',
        };
      }

      // Test a basic method
      if (typeof chrome.enterprise.networkingAttributes.getNetworkDetails !== 'function') {
        return {
          available: false,
          message: 'chrome.enterprise.networkingAttributes.getNetworkDetails is not available',
          details:
            'The enterprise networking attributes API appears to be partially available. Check manifest permissions and platform compatibility.',
        };
      }

      return {
        available: true,
        message: 'Enterprise Networking Attributes API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.enterprise.networkingAttributes API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('getNetworkDetails')) {
      this.registerGetNetworkDetails();
    }
  }

  private registerGetNetworkDetails(): void {
    this.server.registerTool(
      'extension_tool_get_network_details',
      {
        description:
          'Get network details for the current network connection including enterprise networking attributes',
        inputSchema: {},
      },
      async () => {
        try {
          const networkDetails =
            await new Promise<chrome.enterprise.networkingAttributes.NetworkDetails>(
              (resolve, reject) => {
                chrome.enterprise.networkingAttributes.getNetworkDetails((details) => {
                  if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                  } else {
                    resolve(details);
                  }
                });
              }
            );

          return this.formatJson({
            macAddress: networkDetails.macAddress,
            ipv4: networkDetails.ipv4,
            ipv6: networkDetails.ipv6,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
