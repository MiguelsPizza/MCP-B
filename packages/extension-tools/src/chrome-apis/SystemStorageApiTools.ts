import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { type ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface SystemStorageApiToolsOptions {
  getInfo?: boolean;
  ejectDevice?: boolean;
  getAvailableCapacity?: boolean;
}

export class SystemStorageApiTools extends BaseApiTools {
  protected apiName = 'System.storage';

  constructor(server: McpServer, options: SystemStorageApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.system || !chrome.system.storage) {
        return {
          available: false,
          message: 'chrome.system.storage API is not defined',
          details: 'This extension needs the "system.storage" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.system.storage.getInfo !== 'function') {
        return {
          available: false,
          message: 'chrome.system.storage.getInfo is not available',
          details:
            'The system.storage API appears to be partially available. Check manifest permissions.',
        };
      }

      // Try to actually use the API
      chrome.system.storage.getInfo((_storageInfo) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'System.storage API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.system.storage API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('getInfo')) {
      this.registerGetInfo();
    }

    if (this.shouldRegisterTool('ejectDevice')) {
      this.registerEjectDevice();
    }

    if (this.shouldRegisterTool('getAvailableCapacity')) {
      this.registerGetAvailableCapacity();
    }
  }

  private registerGetInfo(): void {
    this.server.registerTool(
      'extension_tool_get_storage_info',
      {
        description: 'Get information about all attached storage devices',
        inputSchema: {},
      },
      async () => {
        try {
          const storageInfo = await new Promise<chrome.system.storage.StorageUnitInfo[]>(
            (resolve, reject) => {
              chrome.system.storage.getInfo((info) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(info);
                }
              });
            }
          );

          return this.formatJson({
            count: storageInfo.length,
            devices: storageInfo.map((device) => ({
              id: device.id,
              name: device.name,
              type: device.type,
              capacity: device.capacity,
              capacityFormatted: this.formatBytes(device.capacity),
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerEjectDevice(): void {
    this.server.registerTool(
      'extension_tool_eject_storage_device',
      {
        description: 'Eject a removable storage device',
        inputSchema: {
          id: z.string().describe('The transient device ID from getInfo'),
        },
      },
      async ({ id }) => {
        try {
          const result = await new Promise((resolve, reject) => {
            chrome.system.storage.ejectDevice(id, (result) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(result);
              }
            });
          });

          const success = result === 'success';
          const message = this.getEjectResultMessage(result);

          if (success) {
            return this.formatSuccess('Device ejected successfully', {
              deviceId: id,
              result: result,
              message: message,
            });
          } else {
            return this.formatError(`Failed to eject device: ${message}`);
          }
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetAvailableCapacity(): void {
    this.server.registerTool(
      'extension_tool_get_available_capacity',
      {
        description: 'Get the available capacity of a specified storage device',
        inputSchema: {
          id: z.string().describe('The transient device ID from getInfo'),
        },
      },
      async ({ id }) => {
        try {
          const capacityInfo = await new Promise<chrome.system.storage.StorageCapacityInfo>(
            (resolve, reject) => {
              chrome.system.storage.getAvailableCapacity(id, (info) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(info);
                }
              });
            }
          );

          return this.formatJson({
            deviceId: id,
            availableCapacity: capacityInfo.availableCapacity,
            availableCapacityFormatted: this.formatBytes(capacityInfo.availableCapacity),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private getEjectResultMessage(result: any): string {
    switch (result) {
      case 'success':
        return 'Device ejected successfully';
      case 'in_use':
        return 'Device is currently in use and cannot be ejected';
      case 'no_such_device':
        return 'No such device found';
      case 'failure':
        return 'Failed to eject device due to unknown error';
      default:
        return `Unknown result: ${result}`;
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / k ** i).toFixed(2)) + ' ' + sizes[i];
  }
}
