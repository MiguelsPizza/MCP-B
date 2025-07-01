import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { type ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface EnterpriseDeviceAttributesApiToolsOptions {
  getDirectoryDeviceId?: boolean;
  getDeviceSerialNumber?: boolean;
  getDeviceAssetId?: boolean;
  getDeviceAnnotatedLocation?: boolean;
  getDeviceHostname?: boolean;
}

export class EnterpriseDeviceAttributesApiTools extends BaseApiTools {
  protected apiName = 'Enterprise.deviceAttributes';

  constructor(server: McpServer, options: EnterpriseDeviceAttributesApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.enterprise || !chrome.enterprise.deviceAttributes) {
        return {
          available: false,
          message: 'chrome.enterprise.deviceAttributes API is not defined',
          details:
            'This extension needs the "enterprise.deviceAttributes" permission in its manifest.json and must run on Chrome OS',
        };
      }

      // Test a basic method
      if (typeof chrome.enterprise.deviceAttributes.getDirectoryDeviceId !== 'function') {
        return {
          available: false,
          message: 'chrome.enterprise.deviceAttributes.getDirectoryDeviceId is not available',
          details:
            'The enterprise device attributes API appears to be partially available. Check manifest permissions and ensure this is running on Chrome OS.',
        };
      }

      // Try to actually use the API
      chrome.enterprise.deviceAttributes.getDirectoryDeviceId((_deviceId) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'Enterprise Device Attributes API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.enterprise.deviceAttributes API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('getDirectoryDeviceId')) {
      this.registerGetDirectoryDeviceId();
    }

    if (this.shouldRegisterTool('getDeviceSerialNumber')) {
      this.registerGetDeviceSerialNumber();
    }

    if (this.shouldRegisterTool('getDeviceAssetId')) {
      this.registerGetDeviceAssetId();
    }

    if (this.shouldRegisterTool('getDeviceAnnotatedLocation')) {
      this.registerGetDeviceAnnotatedLocation();
    }

    if (this.shouldRegisterTool('getDeviceHostname')) {
      this.registerGetDeviceHostname();
    }
  }

  private registerGetDirectoryDeviceId(): void {
    this.server.registerTool(
      'extension_tool_get_directory_device_id',
      {
        description: 'Get the directory device ID for the Chrome OS device',
        inputSchema: {},
      },
      async () => {
        try {
          const deviceId = await new Promise<string>((resolve, reject) => {
            chrome.enterprise.deviceAttributes.getDirectoryDeviceId((deviceId) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(deviceId);
              }
            });
          });

          return this.formatJson({
            directoryDeviceId: deviceId,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetDeviceSerialNumber(): void {
    this.server.registerTool(
      'extension_tool_get_device_serial_number',
      {
        description: 'Get the serial number of the Chrome OS device',
        inputSchema: {},
      },
      async () => {
        try {
          const serialNumber = await new Promise<string>((resolve, reject) => {
            chrome.enterprise.deviceAttributes.getDeviceSerialNumber((serialNumber) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(serialNumber);
              }
            });
          });

          return this.formatJson({
            deviceSerialNumber: serialNumber,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetDeviceAssetId(): void {
    this.server.registerTool(
      'extension_tool_get_device_asset_id',
      {
        description: 'Get the asset ID of the Chrome OS device',
        inputSchema: {},
      },
      async () => {
        try {
          const assetId = await new Promise<string>((resolve, reject) => {
            chrome.enterprise.deviceAttributes.getDeviceAssetId((assetId) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(assetId);
              }
            });
          });

          return this.formatJson({
            deviceAssetId: assetId,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetDeviceAnnotatedLocation(): void {
    this.server.registerTool(
      'extension_tool_get_device_annotated_location',
      {
        description: 'Get the annotated location of the Chrome OS device',
        inputSchema: {},
      },
      async () => {
        try {
          const annotatedLocation = await new Promise<string>((resolve, reject) => {
            chrome.enterprise.deviceAttributes.getDeviceAnnotatedLocation((annotatedLocation) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(annotatedLocation);
              }
            });
          });

          return this.formatJson({
            deviceAnnotatedLocation: annotatedLocation,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetDeviceHostname(): void {
    this.server.registerTool(
      'extension_tool_get_device_hostname',
      {
        description: 'Get the hostname of the Chrome OS device',
        inputSchema: {},
      },
      async () => {
        try {
          const hostname = await new Promise<string>((resolve, reject) => {
            chrome.enterprise.deviceAttributes.getDeviceHostname((hostname) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(hostname);
              }
            });
          });

          return this.formatJson({
            deviceHostname: hostname,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
