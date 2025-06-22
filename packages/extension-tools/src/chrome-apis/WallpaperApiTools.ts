import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface WallpaperApiToolsOptions {
  setWallpaper?: boolean;
}

export class WallpaperApiTools extends BaseApiTools {
  protected apiName = 'Wallpaper';

  constructor(
    server: McpServer,
    options: WallpaperApiToolsOptions = {}
  ) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.wallpaper) {
        return {
          available: false,
          message: 'chrome.wallpaper API is not defined',
          details: 'This extension needs the "wallpaper" permission in its manifest.json and only works on ChromeOS',
        };
      }

      // Test a basic method
      if (typeof chrome.wallpaper.setWallpaper !== 'function') {
        return {
          available: false,
          message: 'chrome.wallpaper.setWallpaper is not available',
          details: 'The wallpaper API appears to be partially available. Check manifest permissions and ensure you are running on ChromeOS.',
        };
      }

      return {
        available: true,
        message: 'Wallpaper API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.wallpaper API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('setWallpaper')) {
      this.registerSetWallpaper();
    }
  }

  private registerSetWallpaper(): void {
    this.server.registerTool(
      'set_wallpaper',
      {
        description: 'Set the ChromeOS wallpaper to an image from a URL or data',
        inputSchema: {
          filename: z.string().describe('The file name of the saved wallpaper'),
          layout: z
            .enum(['STRETCH', 'CENTER', 'CENTER_CROPPED'])
            .describe('The wallpaper layout'),
          url: z
            .string()
            .optional()
            .describe('The URL of the wallpaper to be set (can be relative)'),
          data: z
            .string()
            .optional()
            .describe('Base64 encoded jpeg or png wallpaper image data'),
          thumbnail: z
            .boolean()
            .optional()
            .describe('True if a 128x60 thumbnail should be generated'),
        },
      },
      async ({ filename, layout, url, data, thumbnail }) => {
        try {
          // Validate that either url or data is provided
          if (!url && !data) {
            return this.formatError(
              'Either url or data must be specified to set wallpaper'
            );
          }

          if (url && data) {
            return this.formatError(
              'Cannot specify both url and data. Choose one method to set wallpaper'
            );
          }

          // Build wallpaper details
          const details: any = {
            filename,
            layout,
          };

          if (url) {
            details.url = url;
          }

          if (data) {
            try {
              // Convert base64 to ArrayBuffer
              const binaryString = atob(data);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              details.data = bytes.buffer;
            } catch (error) {
              return this.formatError('Invalid base64 data provided');
            }
          }

          if (thumbnail !== undefined) {
            details.thumbnail = thumbnail;
          }

          // Set the wallpaper
          const thumbnailResult = await new Promise<ArrayBuffer | undefined>((resolve, reject) => {
            chrome.wallpaper.setWallpaper(details, (thumbnail) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(thumbnail);
              }
            });
          });

          const result: any = {
            filename,
            layout,
            success: true,
          };

          if (url) {
            result.url = url;
          }

          if (thumbnailResult) {
            // Convert ArrayBuffer to base64 for JSON response
            const bytes = new Uint8Array(thumbnailResult);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            result.thumbnail = btoa(binary);
            result.thumbnailSize = thumbnailResult.byteLength;
          }

          return this.formatSuccess('Wallpaper set successfully', result);
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}