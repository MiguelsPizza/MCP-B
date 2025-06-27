import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface DesktopCaptureApiToolsOptions {
  chooseDesktopMedia?: boolean;
  cancelChooseDesktopMedia?: boolean;
}

export class DesktopCaptureApiTools extends BaseApiTools {
  protected apiName = 'DesktopCapture';

  constructor(server: McpServer, options: DesktopCaptureApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.desktopCapture) {
        return {
          available: false,
          message: 'chrome.desktopCapture API is not defined',
          details: 'This extension needs the "desktopCapture" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.desktopCapture.chooseDesktopMedia !== 'function') {
        return {
          available: false,
          message: 'chrome.desktopCapture.chooseDesktopMedia is not available',
          details:
            'The desktopCapture API appears to be partially available. Check manifest permissions.',
        };
      }

      return {
        available: true,
        message: 'DesktopCapture API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.desktopCapture API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('chooseDesktopMedia')) {
      this.registerChooseDesktopMedia();
    }

    if (this.shouldRegisterTool('cancelChooseDesktopMedia')) {
      this.registerCancelChooseDesktopMedia();
    }
  }

  private registerChooseDesktopMedia(): void {
    this.server.registerTool(
      'extension_tool_choose_desktop_media',
      {
        description: 'Shows desktop media picker UI with the specified set of sources',
        inputSchema: {
          sources: z
            .array(z.enum(['screen', 'window', 'tab', 'audio']))
            .describe(
              'Set of sources that should be shown to the user. The sources order in the set decides the tab order in the picker'
            ),
          targetTabId: z
            .number()
            .describe(
              'Optional tab ID for which the stream is created. If not specified then the resulting stream can be used only by the calling extension'
            ),
        },
      },
      async ({ sources, targetTabId }) => {
        try {
          let targetTab: chrome.tabs.Tab;

          if (targetTabId !== undefined) {
            targetTab = await new Promise<chrome.tabs.Tab>((resolve, reject) => {
              chrome.tabs.get(targetTabId, (tab) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(tab);
                }
              });
            });
          }

          const result = await new Promise<{
            requestId: number;
            streamId: string;
            options: any;
          }>((resolve, reject) => {
            const requestId = chrome.desktopCapture.chooseDesktopMedia(
              sources,
              targetTab,
              (streamId: string, options: any) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve({ requestId, streamId, options });
                }
              }
            );
          });

          if (!result.streamId) {
            return this.formatSuccess('User canceled the desktop media selection');
          }

          return this.formatJson({
            requestId: result.requestId,
            streamId: result.streamId,
            canRequestAudioTrack: result.options?.canRequestAudioTrack || false,
            sources: sources,
            targetTabId: targetTabId,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerCancelChooseDesktopMedia(): void {
    this.server.registerTool(
      'extension_tool_cancel_choose_desktop_media',
      {
        description: 'Hides desktop media picker dialog shown by chooseDesktopMedia',
        inputSchema: {
          desktopMediaRequestId: z.number().describe('Id returned by chooseDesktopMedia()'),
        },
      },
      async ({ desktopMediaRequestId }) => {
        try {
          chrome.desktopCapture.cancelChooseDesktopMedia(desktopMediaRequestId);

          return this.formatSuccess('Desktop media picker dialog canceled successfully', {
            requestId: desktopMediaRequestId,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
