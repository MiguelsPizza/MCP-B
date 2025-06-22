import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface DocumentScanApiToolsOptions {
  scan?: boolean;
  getScannerList?: boolean;
  openScanner?: boolean;
  closeScanner?: boolean;
  getOptionGroups?: boolean;
  setOptions?: boolean;
  startScan?: boolean;
  readScanData?: boolean;
  cancelScan?: boolean;
}

export class DocumentScanApiTools extends BaseApiTools {
  protected apiName = 'DocumentScan';

  constructor(server: McpServer, options: DocumentScanApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.documentScan) {
        return {
          available: false,
          message: 'chrome.documentScan API is not defined',
          details:
            'This extension needs the "documentScan" permission in its manifest.json and only works on ChromeOS',
        };
      }

      // Test a basic method
      if (typeof chrome.documentScan.scan !== 'function') {
        return {
          available: false,
          message: 'chrome.documentScan.scan is not available',
          details:
            'The documentScan API appears to be partially available. Check manifest permissions and ensure you are running on ChromeOS.',
        };
      }

      return {
        available: true,
        message: 'DocumentScan API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.documentScan API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('scan')) {
      this.registerScan();
    }

    if (this.shouldRegisterTool('getScannerList')) {
      this.registerGetScannerList();
    }

    if (this.shouldRegisterTool('openScanner')) {
      this.registerOpenScanner();
    }

    if (this.shouldRegisterTool('closeScanner')) {
      this.registerCloseScanner();
    }

    if (this.shouldRegisterTool('getOptionGroups')) {
      this.registerGetOptionGroups();
    }

    if (this.shouldRegisterTool('setOptions')) {
      this.registerSetOptions();
    }

    if (this.shouldRegisterTool('startScan')) {
      this.registerStartScan();
    }

    if (this.shouldRegisterTool('readScanData')) {
      this.registerReadScanData();
    }

    if (this.shouldRegisterTool('cancelScan')) {
      this.registerCancelScan();
    }
  }

  private registerScan(): void {
    this.server.registerTool(
      'document_scan',
      {
        description: 'Perform a simple document scan using any available scanner',
        inputSchema: {
          maxImages: z
            .number()
            .min(1)
            .optional()
            .describe('The number of scanned images allowed. Default is 1'),
          mimeTypes: z
            .array(z.string())
            .optional()
            .describe(
              'The MIME types that are accepted by the caller (e.g., ["image/jpeg", "image/png"])'
            ),
        },
      },
      async ({ maxImages, mimeTypes }) => {
        try {
          const scanOptions: chrome.documentScan.ScanOptions = {};

          if (maxImages !== undefined) {
            scanOptions.maxImages = maxImages;
          }

          if (mimeTypes !== undefined) {
            scanOptions.mimeTypes = mimeTypes;
          }

          const result = await new Promise<chrome.documentScan.ScanResults>((resolve, reject) => {
            chrome.documentScan.scan(scanOptions, (result) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(result);
              }
            });
          });

          return this.formatJson({
            mimeType: result.mimeType,
            imageCount: result.dataUrls.length,
            dataUrls: result.dataUrls,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetScannerList(): void {
    this.server.registerTool(
      'get_scanner_list',
      {
        description: 'Get the list of available document scanners',
        inputSchema: {
          local: z
            .boolean()
            .optional()
            .describe('Only return scanners that are directly attached to the computer'),
          secure: z
            .boolean()
            .optional()
            .describe('Only return scanners that use a secure transport, such as USB or TLS'),
        },
      },
      async ({ local, secure }) => {
        try {
          const filter: chrome.documentScan.DeviceFilter = {};

          if (local !== undefined) {
            filter.local = local;
          }

          if (secure !== undefined) {
            filter.secure = secure;
          }

          const response = await new Promise<chrome.documentScan.GetScannerListResponse>(
            (resolve, reject) => {
              chrome.documentScan.getScannerList(filter, (response) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(response);
                }
              });
            }
          );

          return this.formatJson({
            result: response.result,
            scannerCount: response.scanners.length,
            scanners: response.scanners.map((scanner) => ({
              scannerId: scanner.scannerId,
              name: scanner.name,
              manufacturer: scanner.manufacturer,
              model: scanner.model,
              deviceUuid: scanner.deviceUuid,
              connectionType: scanner.connectionType,
              protocolType: scanner.protocolType,
              secure: scanner.secure,
              imageFormats: scanner.imageFormats,
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerOpenScanner(): void {
    this.server.registerTool(
      'open_scanner',
      {
        description: 'Open a scanner for exclusive access and configuration',
        inputSchema: {
          scannerId: z.string().describe('The ID of a scanner to be opened (from getScannerList)'),
        },
      },
      async ({ scannerId }) => {
        try {
          const response = await new Promise<chrome.documentScan.OpenScannerResponse<any>>(
            (resolve, reject) => {
              chrome.documentScan.openScanner(scannerId, (response) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(response);
                }
              });
            }
          );

          const result: any = {
            result: response.result,
            scannerId: response.scannerId,
          };

          if (response.scannerHandle) {
            result.scannerHandle = response.scannerHandle;
          }

          if (response.options) {
            result.optionCount = Object.keys(response.options).length;
            result.availableOptions = Object.keys(response.options);
          }

          return this.formatJson(result);
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerCloseScanner(): void {
    this.server.registerTool(
      'close_scanner',
      {
        description: 'Close a previously opened scanner',
        inputSchema: {
          scannerHandle: z.string().describe('The handle of an open scanner from openScanner'),
        },
      },
      async ({ scannerHandle }) => {
        try {
          const response = await new Promise<chrome.documentScan.CloseScannerResponse<any>>(
            (resolve, reject) => {
              chrome.documentScan.closeScanner(scannerHandle, (response) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(response);
                }
              });
            }
          );

          return this.formatJson({
            result: response.result,
            scannerHandle: response.scannerHandle,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetOptionGroups(): void {
    this.server.registerTool(
      'get_option_groups',
      {
        description: 'Get the group names and member options from an open scanner',
        inputSchema: {
          scannerHandle: z.string().describe('The handle of an open scanner from openScanner'),
        },
      },
      async ({ scannerHandle }) => {
        try {
          const response = await new Promise<chrome.documentScan.GetOptionGroupsResponse<any>>(
            (resolve, reject) => {
              chrome.documentScan.getOptionGroups(scannerHandle, (response) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(response);
                }
              });
            }
          );

          const result: any = {
            result: response.result,
            scannerHandle: response.scannerHandle,
          };

          if (response.groups) {
            result.groupCount = response.groups.length;
            result.groups = response.groups.map((group) => ({
              title: group.title,
              memberCount: group.members.length,
              members: group.members,
            }));
          }

          return this.formatJson(result);
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetOptions(): void {
    this.server.registerTool(
      'set_scanner_options',
      {
        description: 'Set options on a scanner',
        inputSchema: {
          scannerHandle: z.string().describe('The handle of an open scanner from openScanner'),
          options: z
            .array(
              z.object({
                name: z.string().describe('The name of the option to set'),
                type: z
                  .enum(['UNKNOWN', 'BOOL', 'INT', 'FIXED', 'STRING', 'BUTTON', 'GROUP'])
                  .describe('The data type of the option'),
                value: z
                  .union([z.string(), z.number(), z.boolean(), z.array(z.number())])
                  .optional()
                  .describe('The value to set (leave unset for automatic setting)'),
              })
            )
            .describe('Array of option settings to apply'),
        },
      },
      async ({ scannerHandle, options }) => {
        try {
          const optionSettings: chrome.documentScan.OptionSetting[] = options.map((option) => {
            const setting: chrome.documentScan.OptionSetting = {
              name: option.name,
              type: option.type as chrome.documentScan.OptionType,
            };

            if (option.value !== undefined) {
              setting.value = option.value as any;
            }

            return setting;
          });

          const response = await new Promise<chrome.documentScan.SetOptionsResponse<any>>(
            (resolve, reject) => {
              chrome.documentScan.setOptions(scannerHandle, optionSettings, (response) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(response);
                }
              });
            }
          );

          const result: any = {
            scannerHandle: response.scannerHandle,
            results: response.results.map((result) => ({
              name: result.name,
              result: result.result,
            })),
          };

          if (response.options) {
            result.updatedOptionCount = Object.keys(response.options).length;
            result.updatedOptions = Object.keys(response.options);
          }

          return this.formatJson(result);
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerStartScan(): void {
    this.server.registerTool(
      'start_scan',
      {
        description: 'Start a scan on an open scanner',
        inputSchema: {
          scannerHandle: z.string().describe('The handle of an open scanner from openScanner'),
          format: z
            .string()
            .describe('The MIME type to return scanned data in (e.g., "image/jpeg")'),
          maxReadSize: z
            .number()
            .min(32768)
            .optional()
            .describe('Maximum bytes returned in a single readScanData response (minimum 32768)'),
        },
      },
      async ({ scannerHandle, format, maxReadSize }) => {
        try {
          const startScanOptions: chrome.documentScan.StartScanOptions = {
            format: format,
          };

          if (maxReadSize !== undefined) {
            startScanOptions.maxReadSize = maxReadSize;
          }

          const response = await new Promise<chrome.documentScan.StartScanResponse<any>>(
            (resolve, reject) => {
              chrome.documentScan.startScan(scannerHandle, startScanOptions, (response) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(response);
                }
              });
            }
          );

          const result: any = {
            result: response.result,
            scannerHandle: response.scannerHandle,
          };

          if (response.job) {
            result.job = response.job;
          }

          return this.formatJson(result);
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerReadScanData(): void {
    this.server.registerTool(
      'read_scan_data',
      {
        description: 'Read the next chunk of scan data from an active scan job',
        inputSchema: {
          job: z.string().describe('Active job handle from startScan'),
        },
      },
      async ({ job }) => {
        try {
          const response = await new Promise<chrome.documentScan.ReadScanDataResponse<any>>(
            (resolve, reject) => {
              chrome.documentScan.readScanData(job, (response) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(response);
                }
              });
            }
          );

          const result: any = {
            job: response.job,
            result: response.result,
          };

          if (response.data) {
            result.dataSize = response.data.byteLength;
            result.hasData = response.data.byteLength > 0;
          }

          if (response.estimatedCompletion !== undefined) {
            result.estimatedCompletion = response.estimatedCompletion;
          }

          return this.formatJson(result);
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerCancelScan(): void {
    this.server.registerTool(
      'cancel_scan',
      {
        description: 'Cancel an active scan job',
        inputSchema: {
          job: z.string().describe('The handle of an active scan job from startScan'),
        },
      },
      async ({ job }) => {
        try {
          const response = await new Promise<chrome.documentScan.CancelScanResponse<any>>(
            (resolve, reject) => {
              chrome.documentScan.cancelScan(job, (response) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(response);
                }
              });
            }
          );

          return this.formatJson({
            job: response.job,
            result: response.result,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
