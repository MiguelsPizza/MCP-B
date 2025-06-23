import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface FontSettingsApiToolsOptions {
  getFont?: boolean;
  setFont?: boolean;
  clearFont?: boolean;
  getFontList?: boolean;
  getDefaultFontSize?: boolean;
  setDefaultFontSize?: boolean;
  clearDefaultFontSize?: boolean;
  getDefaultFixedFontSize?: boolean;
  setDefaultFixedFontSize?: boolean;
  clearDefaultFixedFontSize?: boolean;
  getMinimumFontSize?: boolean;
  setMinimumFontSize?: boolean;
  clearMinimumFontSize?: boolean;
}

export class FontSettingsApiTools extends BaseApiTools {
  protected apiName = 'FontSettings';

  constructor(server: McpServer, options: FontSettingsApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.fontSettings) {
        return {
          available: false,
          message: 'chrome.fontSettings API is not defined',
          details: 'This extension needs the "fontSettings" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.fontSettings.getFontList !== 'function') {
        return {
          available: false,
          message: 'chrome.fontSettings.getFontList is not available',
          details:
            'The fontSettings API appears to be partially available. Check manifest permissions.',
        };
      }

      // Try to actually use the API
      chrome.fontSettings.getFontList((_fonts) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'FontSettings API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.fontSettings API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('getFont')) {
      this.registerGetFont();
    }

    if (this.shouldRegisterTool('setFont')) {
      this.registerSetFont();
    }

    if (this.shouldRegisterTool('clearFont')) {
      this.registerClearFont();
    }

    if (this.shouldRegisterTool('getFontList')) {
      this.registerGetFontList();
    }

    if (this.shouldRegisterTool('getDefaultFontSize')) {
      this.registerGetDefaultFontSize();
    }

    if (this.shouldRegisterTool('setDefaultFontSize')) {
      this.registerSetDefaultFontSize();
    }

    if (this.shouldRegisterTool('clearDefaultFontSize')) {
      this.registerClearDefaultFontSize();
    }

    if (this.shouldRegisterTool('getDefaultFixedFontSize')) {
      this.registerGetDefaultFixedFontSize();
    }

    if (this.shouldRegisterTool('setDefaultFixedFontSize')) {
      this.registerSetDefaultFixedFontSize();
    }

    if (this.shouldRegisterTool('clearDefaultFixedFontSize')) {
      this.registerClearDefaultFixedFontSize();
    }

    if (this.shouldRegisterTool('getMinimumFontSize')) {
      this.registerGetMinimumFontSize();
    }

    if (this.shouldRegisterTool('setMinimumFontSize')) {
      this.registerSetMinimumFontSize();
    }

    if (this.shouldRegisterTool('clearMinimumFontSize')) {
      this.registerClearMinimumFontSize();
    }
  }

  private registerGetFont(): void {
    this.server.registerTool(
      'get_font',
      {
        description: 'Get the font for a given script and generic font family',
        inputSchema: {
          genericFamily: z
            .enum(['standard', 'sansserif', 'serif', 'fixed', 'cursive', 'fantasy', 'math'])
            .describe('The generic font family for which the font should be retrieved'),
          script: z
            .string()
            .optional()
            .describe(
              'The script for which the font should be retrieved. If omitted, the font setting for the global script (script code "Zyyy") is retrieved'
            ),
        },
      },
      async ({ genericFamily, script }) => {
        try {
          const details: any = { genericFamily };
          if (script !== undefined) {
            details.script = script;
          }

          const result = await new Promise<any>((resolve, reject) => {
            chrome.fontSettings.getFont(details, (result) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(result);
              }
            });
          });

          return this.formatJson({
            fontId: result.fontId,
            levelOfControl: result.levelOfControl,
            genericFamily,
            script: script || 'Zyyy',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetFont(): void {
    this.server.registerTool(
      'set_font',
      {
        description: 'Set the font for a given script and generic font family',
        inputSchema: {
          fontId: z
            .string()
            .describe(
              'The font ID. The empty string means to fallback to the global script font setting'
            ),
          genericFamily: z
            .enum(['standard', 'sansserif', 'serif', 'fixed', 'cursive', 'fantasy', 'math'])
            .describe('The generic font family for which the font should be set'),
          script: z
            .string()
            .optional()
            .describe(
              'The script code which the font should be set. If omitted, the font setting for the global script (script code "Zyyy") is set'
            ),
        },
      },
      async ({ fontId, genericFamily, script }) => {
        try {
          const details: any = { fontId, genericFamily };
          if (script !== undefined) {
            details.script = script;
          }

          await new Promise<void>((resolve, reject) => {
            chrome.fontSettings.setFont(details, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Font set successfully', {
            fontId,
            genericFamily,
            script: script || 'Zyyy',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerClearFont(): void {
    this.server.registerTool(
      'clear_font',
      {
        description: 'Clear the font set by this extension, if any',
        inputSchema: {
          genericFamily: z
            .enum(['standard', 'sansserif', 'serif', 'fixed', 'cursive', 'fantasy', 'math'])
            .describe('The generic font family for which the font should be cleared'),
          script: z
            .string()
            .optional()
            .describe(
              'The script for which the font should be cleared. If omitted, the global script font setting is cleared'
            ),
        },
      },
      async ({ genericFamily, script }) => {
        try {
          const details: any = { genericFamily };
          if (script !== undefined) {
            details.script = script;
          }

          await new Promise<void>((resolve, reject) => {
            chrome.fontSettings.clearFont(details, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Font cleared successfully', {
            genericFamily,
            script: script || 'Zyyy',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetFontList(): void {
    this.server.registerTool(
      'get_font_list',
      {
        description: 'Get a list of fonts on the system',
        inputSchema: {},
      },
      async () => {
        try {
          const fonts = await new Promise<any[]>((resolve, reject) => {
            chrome.fontSettings.getFontList((fonts) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(fonts);
              }
            });
          });

          return this.formatJson({
            count: fonts.length,
            fonts: fonts.map((font) => ({
              fontId: font.fontId,
              displayName: font.displayName,
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetDefaultFontSize(): void {
    this.server.registerTool(
      'get_default_font_size',
      {
        description: 'Get the default font size',
        inputSchema: {},
      },
      async () => {
        try {
          const result = await new Promise<any>((resolve, reject) => {
            chrome.fontSettings.getDefaultFontSize({}, (result) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(result);
              }
            });
          });

          return this.formatJson({
            pixelSize: result.pixelSize,
            levelOfControl: result.levelOfControl,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetDefaultFontSize(): void {
    this.server.registerTool(
      'set_default_font_size',
      {
        description: 'Set the default font size',
        inputSchema: {
          pixelSize: z.number().min(6).max(72).describe('The font size in pixels'),
        },
      },
      async ({ pixelSize }) => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.fontSettings.setDefaultFontSize({ pixelSize }, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Default font size set successfully', {
            pixelSize,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerClearDefaultFontSize(): void {
    this.server.registerTool(
      'clear_default_font_size',
      {
        description: 'Clear the default font size set by this extension, if any',
        inputSchema: {},
      },
      async () => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.fontSettings.clearDefaultFontSize({}, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Default font size cleared successfully');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetDefaultFixedFontSize(): void {
    this.server.registerTool(
      'get_default_fixed_font_size',
      {
        description: 'Get the default size for fixed width fonts',
        inputSchema: {},
      },
      async () => {
        try {
          const result = await new Promise<any>((resolve, reject) => {
            chrome.fontSettings.getDefaultFixedFontSize({}, (result) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(result);
              }
            });
          });

          return this.formatJson({
            pixelSize: result.pixelSize,
            levelOfControl: result.levelOfControl,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetDefaultFixedFontSize(): void {
    this.server.registerTool(
      'set_default_fixed_font_size',
      {
        description: 'Set the default size for fixed width fonts',
        inputSchema: {
          pixelSize: z.number().min(6).max(72).describe('The font size in pixels'),
        },
      },
      async ({ pixelSize }) => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.fontSettings.setDefaultFixedFontSize({ pixelSize }, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Default fixed font size set successfully', {
            pixelSize,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerClearDefaultFixedFontSize(): void {
    this.server.registerTool(
      'clear_default_fixed_font_size',
      {
        description: 'Clear the default fixed font size set by this extension, if any',
        inputSchema: {},
      },
      async () => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.fontSettings.clearDefaultFixedFontSize({}, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Default fixed font size cleared successfully');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetMinimumFontSize(): void {
    this.server.registerTool(
      'get_minimum_font_size',
      {
        description: 'Get the minimum font size',
        inputSchema: {},
      },
      async () => {
        try {
          const result = await new Promise<any>((resolve, reject) => {
            chrome.fontSettings.getMinimumFontSize({}, (result) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(result);
              }
            });
          });

          return this.formatJson({
            pixelSize: result.pixelSize,
            levelOfControl: result.levelOfControl,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetMinimumFontSize(): void {
    this.server.registerTool(
      'set_minimum_font_size',
      {
        description: 'Set the minimum font size',
        inputSchema: {
          pixelSize: z.number().min(6).max(24).describe('The font size in pixels'),
        },
      },
      async ({ pixelSize }) => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.fontSettings.setMinimumFontSize({ pixelSize }, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Minimum font size set successfully', {
            pixelSize,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerClearMinimumFontSize(): void {
    this.server.registerTool(
      'clear_minimum_font_size',
      {
        description: 'Clear the minimum font size set by this extension, if any',
        inputSchema: {},
      },
      async () => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.fontSettings.clearMinimumFontSize({}, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Minimum font size cleared successfully');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
