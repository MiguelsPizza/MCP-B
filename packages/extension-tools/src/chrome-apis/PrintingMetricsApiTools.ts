import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { type ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface PrintingMetricsApiToolsOptions {
  getPrintJobs?: boolean;
}

export class PrintingMetricsApiTools extends BaseApiTools {
  protected apiName = 'PrintingMetrics';

  constructor(server: McpServer, options: PrintingMetricsApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.printingMetrics) {
        return {
          available: false,
          message: 'chrome.printingMetrics API is not defined',
          details:
            'This extension needs the "printingMetrics" permission in its manifest.json and only works on ChromeOS',
        };
      }

      // Test a basic method
      if (typeof chrome.printingMetrics.getPrintJobs !== 'function') {
        return {
          available: false,
          message: 'chrome.printingMetrics.getPrintJobs is not available',
          details:
            'The printingMetrics API appears to be partially available. Check manifest permissions and ensure this is running on ChromeOS.',
        };
      }

      // Try to actually use the API
      chrome.printingMetrics.getPrintJobs((_jobs) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'PrintingMetrics API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.printingMetrics API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('getPrintJobs')) {
      this.registerGetPrintJobs();
    }
  }

  private registerGetPrintJobs(): void {
    this.server.registerTool(
      'extension_tool_get_print_jobs',
      {
        description:
          'Get the list of finished print jobs with details about printers, settings, and status',
        inputSchema: {},
      },
      async () => {
        try {
          const jobs = await new Promise<chrome.printingMetrics.PrintJobInfo[]>(
            (resolve, reject) => {
              chrome.printingMetrics.getPrintJobs((jobs) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(jobs);
                }
              });
            }
          );

          return this.formatJson({
            count: jobs.length,
            jobs: jobs.map((job) => ({
              id: job.id,
              title: job.title,
              status: job.status,
              source: job.source,
              sourceId: job.sourceId,
              numberOfPages: job.numberOfPages,
              creationTime: job.creationTime,
              creationTimeFormatted: new Date(job.creationTime).toISOString(),
              completionTime: job.completionTime,
              completionTimeFormatted: new Date(job.completionTime).toISOString(),
              printer: {
                name: job.printer.name,
                source: job.printer.source,
                uri: job.printer.uri,
              },
              printerStatus: job.printer_status,
              settings: {
                color: job.settings.color,
                copies: job.settings.copies,
                duplex: job.settings.duplex,
                mediaSize: {
                  width: job.settings.mediaSize.width,
                  height: job.settings.mediaSize.height,
                  vendorId: job.settings.mediaSize.vendorId,
                },
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
