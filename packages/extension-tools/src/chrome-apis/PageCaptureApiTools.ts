import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface PageCaptureApiToolsOptions {
  saveAsMHTML?: boolean;
}

export class PageCaptureApiTools extends BaseApiTools {
  protected apiName = 'PageCapture';

  constructor(server: McpServer, options: PageCaptureApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.pageCapture) {
        return {
          available: false,
          message: 'chrome.pageCapture API is not defined',
          details: 'This extension needs the "pageCapture" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.pageCapture.saveAsMHTML !== 'function') {
        return {
          available: false,
          message: 'chrome.pageCapture.saveAsMHTML is not available',
          details:
            'The pageCapture API appears to be partially available. Check manifest permissions.',
        };
      }

      return {
        available: true,
        message: 'PageCapture API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.pageCapture API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('saveAsMHTML')) {
      this.registerSaveAsMHTML();
    }
  }

  private registerSaveAsMHTML(): void {
    this.server.registerTool(
      'save_as_mhtml',
      {
        description: 'Save the content of a tab as MHTML format',
        inputSchema: {
          tabId: z.number().describe('The ID of the tab to save as MHTML'),
        },
      },
      async ({ tabId }) => {
        try {
          const mhtmlData = await new Promise<Blob | undefined>((resolve, reject) => {
            chrome.pageCapture.saveAsMHTML({ tabId }, (mhtmlData) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(mhtmlData);
              }
            });
          });

          if (!mhtmlData) {
            return this.formatError('Failed to capture page as MHTML - no data returned');
          }

          return this.formatSuccess('Page captured as MHTML successfully', {
            tabId,
            size: mhtmlData.size,
            type: mhtmlData.type,
            sizeFormatted: `${(mhtmlData.size / 1024).toFixed(2)} KB`,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
