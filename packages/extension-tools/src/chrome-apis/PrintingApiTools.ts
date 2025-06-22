import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface PrintingApiToolsOptions {
  getPrinters?: boolean;
  getPrinterInfo?: boolean;
  submitJob?: boolean;
  cancelJob?: boolean;
  getJobStatus?: boolean;
}

export class PrintingApiTools extends BaseApiTools {
  protected apiName = 'Printing';

  constructor(server: McpServer, options: PrintingApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.printing) {
        return {
          available: false,
          message: 'chrome.printing API is not defined',
          details:
            'This extension needs the "printing" permission in its manifest.json and only works on ChromeOS',
        };
      }

      // Test a basic method
      if (typeof chrome.printing.getPrinters !== 'function') {
        return {
          available: false,
          message: 'chrome.printing.getPrinters is not available',
          details:
            'The printing API appears to be partially available. Check manifest permissions and ensure this is running on ChromeOS.',
        };
      }

      // Try to actually use the API
      chrome.printing.getPrinters((_printers) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'Printing API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.printing API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('getPrinters')) {
      this.registerGetPrinters();
    }

    if (this.shouldRegisterTool('getPrinterInfo')) {
      this.registerGetPrinterInfo();
    }

    if (this.shouldRegisterTool('submitJob')) {
      this.registerSubmitJob();
    }

    if (this.shouldRegisterTool('cancelJob')) {
      this.registerCancelJob();
    }

    if (this.shouldRegisterTool('getJobStatus')) {
      this.registerGetJobStatus();
    }
  }

  private registerGetPrinters(): void {
    this.server.registerTool(
      'get_printers',
      {
        description:
          'Get the list of available printers on the device. This includes manually added, enterprise and discovered printers.',
        inputSchema: {},
      },
      async () => {
        try {
          const printers = await new Promise<chrome.printing.Printer[]>((resolve, reject) => {
            chrome.printing.getPrinters((printers) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(printers);
              }
            });
          });

          return this.formatJson({
            count: printers.length,
            printers: printers.map((printer) => ({
              id: printer.id,
              name: printer.name,
              description: printer.description,
              isDefault: printer.isDefault,
              source: printer.source,
              uri: printer.uri,
              recentlyUsedRank: printer.recentlyUsedRank,
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetPrinterInfo(): void {
    this.server.registerTool(
      'get_printer_info',
      {
        description: 'Get the status and capabilities of a specific printer in CDD format',
        inputSchema: {
          printerId: z.string().describe('The ID of the printer to get information for'),
        },
      },
      async ({ printerId }) => {
        try {
          const printerInfo = await new Promise<chrome.printing.GetPrinterInfoResponse>(
            (resolve, reject) => {
              chrome.printing.getPrinterInfo(printerId, (response) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(response);
                }
              });
            }
          );

          return this.formatJson({
            printerId,
            status: printerInfo.status,
            capabilities: printerInfo.capabilities,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSubmitJob(): void {
    this.server.registerTool(
      'submit_job',
      {
        description:
          'Submit a print job to a printer. Supported content types are "application/pdf" and "image/png". User confirmation may be required unless extension is allowlisted.',
        inputSchema: {
          printerId: z.string().describe('The ID of the printer to use'),
          title: z.string().describe('The title of the print job'),
          contentType: z
            .enum(['application/pdf', 'image/png'])
            .describe('The content type of the document to print'),
          documentData: z.string().describe('Base64 encoded document data to print'),
          ticket: z
            .object({
              version: z.string().optional().describe('Ticket version (e.g., "1.0")'),
              print: z
                .object({
                  color: z
                    .object({
                      type: z
                        .string()
                        .optional()
                        .describe('Color type (e.g., "STANDARD_MONOCHROME", "STANDARD_COLOR")'),
                    })
                    .optional(),
                  duplex: z
                    .object({
                      type: z
                        .string()
                        .optional()
                        .describe('Duplex type (e.g., "NO_DUPLEX", "LONG_EDGE", "SHORT_EDGE")'),
                    })
                    .optional(),
                  page_orientation: z
                    .object({
                      type: z
                        .string()
                        .optional()
                        .describe('Page orientation (e.g., "PORTRAIT", "LANDSCAPE")'),
                    })
                    .optional(),
                  copies: z
                    .object({
                      copies: z.number().optional().describe('Number of copies to print'),
                    })
                    .optional(),
                  dpi: z
                    .object({
                      horizontal_dpi: z.number().optional().describe('Horizontal DPI'),
                      vertical_dpi: z.number().optional().describe('Vertical DPI'),
                    })
                    .optional(),
                  media_size: z
                    .object({
                      width_microns: z.number().optional().describe('Paper width in microns'),
                      height_microns: z.number().optional().describe('Paper height in microns'),
                    })
                    .optional(),
                  collate: z
                    .object({
                      collate: z.boolean().optional().describe('Whether to collate pages'),
                    })
                    .optional(),
                  vendor_ticket_item: z
                    .array(
                      z.object({
                        id: z.string().describe('Vendor capability ID'),
                        value: z.any().describe('Vendor capability value'),
                      })
                    )
                    .optional()
                    .describe('Vendor-specific ticket items'),
                })
                .optional(),
            })
            .optional()
            .describe('Print ticket specifying printer capabilities to use'),
        },
      },
      async ({ printerId, title, contentType, documentData, ticket }) => {
        try {
          // Convert base64 data to blob
          const binaryString = atob(documentData);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: contentType });

          const submitJobRequest: chrome.printing.SubmitJobRequest = {
            job: {
              printerId,
              title,
              ticket: ticket || {},
              contentType,
              document: blob,
            },
          };

          const response = await new Promise<chrome.printing.SubmitJobResponse>(
            (resolve, reject) => {
              chrome.printing.submitJob(submitJobRequest, (response) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(response);
                }
              });
            }
          );

          return this.formatJson({
            status: response.status,
            jobId: response.jobId,
            message:
              response.status === 'OK'
                ? 'Print job submitted successfully'
                : 'Print job was rejected',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerCancelJob(): void {
    this.server.registerTool(
      'cancel_job',
      {
        description: 'Cancel a previously submitted print job',
        inputSchema: {
          jobId: z.string().describe('The ID of the print job to cancel'),
        },
      },
      async ({ jobId }) => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.printing.cancelJob(jobId, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Print job cancelled successfully', { jobId });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetJobStatus(): void {
    this.server.registerTool(
      'get_job_status',
      {
        description: 'Get the status of a print job',
        inputSchema: {
          jobId: z.string().describe('The ID of the print job to get status for'),
        },
      },
      async ({ jobId }) => {
        try {
          const status = await new Promise<chrome.printing.JobStatus>((resolve, reject) => {
            chrome.printing.getJobStatus(jobId, (status) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(status as chrome.printing.JobStatus);
              }
            });
          });

          return this.formatJson({
            jobId,
            status,
            statusDescription: this.getJobStatusDescription(status),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private getJobStatusDescription(status: chrome.printing.JobStatus): string {
    switch (status) {
      case 'PENDING':
        return 'Print job is received on Chrome side but was not processed yet';
      case 'IN_PROGRESS':
        return 'Print job is sent for printing';
      case 'FAILED':
        return 'Print job was interrupted due to some error';
      case 'CANCELED':
        return 'Print job was canceled by the user or via API';
      case 'PRINTED':
        return 'Print job was printed without any errors';
      default:
        return 'Unknown status';
    }
  }
}
