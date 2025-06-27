import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface ContentSettingsApiToolsOptions {
  getCookiesSetting?: boolean;
  setCookiesSetting?: boolean;
  clearCookiesSetting?: boolean;
  getJavascriptSetting?: boolean;
  setJavascriptSetting?: boolean;
  clearJavascriptSetting?: boolean;
  getImagesSetting?: boolean;
  setImagesSetting?: boolean;
  clearImagesSetting?: boolean;
  getLocationSetting?: boolean;
  setLocationSetting?: boolean;
  clearLocationSetting?: boolean;
  getNotificationsSetting?: boolean;
  setNotificationsSetting?: boolean;
  clearNotificationsSetting?: boolean;
  getPopupsSetting?: boolean;
  setPopupsSetting?: boolean;
  clearPopupsSetting?: boolean;
  getCameraSetting?: boolean;
  setCameraSetting?: boolean;
  clearCameraSetting?: boolean;
  getMicrophoneSetting?: boolean;
  setMicrophoneSetting?: boolean;
  clearMicrophoneSetting?: boolean;
  getAutomaticDownloadsSetting?: boolean;
  setAutomaticDownloadsSetting?: boolean;
  clearAutomaticDownloadsSetting?: boolean;
  getClipboardSetting?: boolean;
  setClipboardSetting?: boolean;
  clearClipboardSetting?: boolean;
  getAutoVerifySetting?: boolean;
  setAutoVerifySetting?: boolean;
  clearAutoVerifySetting?: boolean;
  getPluginsResourceIdentifiers?: boolean;
}

export class ContentSettingsApiTools extends BaseApiTools {
  protected apiName = 'ContentSettings';

  constructor(server: McpServer, options: ContentSettingsApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.contentSettings) {
        return {
          available: false,
          message: 'chrome.contentSettings API is not defined',
          details: 'This extension needs the "contentSettings" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (
        !chrome.contentSettings.cookies ||
        typeof chrome.contentSettings.cookies.get !== 'function'
      ) {
        return {
          available: false,
          message: 'chrome.contentSettings.cookies.get is not available',
          details:
            'The contentSettings API appears to be partially available. Check manifest permissions.',
        };
      }

      // Try to actually use the API
      chrome.contentSettings.cookies.get(
        {
          primaryUrl: 'https://example.com',
        },
        (_details) => {
          if (chrome.runtime.lastError) {
            throw new Error(chrome.runtime.lastError.message);
          }
        }
      );

      return {
        available: true,
        message: 'ContentSettings API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.contentSettings API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('getCookiesSetting')) {
      this.registerGetCookiesSetting();
    }

    if (this.shouldRegisterTool('setCookiesSetting')) {
      this.registerSetCookiesSetting();
    }

    if (this.shouldRegisterTool('clearCookiesSetting')) {
      this.registerClearCookiesSetting();
    }

    if (this.shouldRegisterTool('getJavascriptSetting')) {
      this.registerGetJavascriptSetting();
    }

    if (this.shouldRegisterTool('setJavascriptSetting')) {
      this.registerSetJavascriptSetting();
    }

    if (this.shouldRegisterTool('clearJavascriptSetting')) {
      this.registerClearJavascriptSetting();
    }

    if (this.shouldRegisterTool('getImagesSetting')) {
      this.registerGetImagesSetting();
    }

    if (this.shouldRegisterTool('setImagesSetting')) {
      this.registerSetImagesSetting();
    }

    if (this.shouldRegisterTool('clearImagesSetting')) {
      this.registerClearImagesSetting();
    }

    if (this.shouldRegisterTool('getLocationSetting')) {
      this.registerGetLocationSetting();
    }

    if (this.shouldRegisterTool('setLocationSetting')) {
      this.registerSetLocationSetting();
    }

    if (this.shouldRegisterTool('clearLocationSetting')) {
      this.registerClearLocationSetting();
    }

    if (this.shouldRegisterTool('getNotificationsSetting')) {
      this.registerGetNotificationsSetting();
    }

    if (this.shouldRegisterTool('setNotificationsSetting')) {
      this.registerSetNotificationsSetting();
    }

    if (this.shouldRegisterTool('clearNotificationsSetting')) {
      this.registerClearNotificationsSetting();
    }

    if (this.shouldRegisterTool('getPopupsSetting')) {
      this.registerGetPopupsSetting();
    }

    if (this.shouldRegisterTool('setPopupsSetting')) {
      this.registerSetPopupsSetting();
    }

    if (this.shouldRegisterTool('clearPopupsSetting')) {
      this.registerClearPopupsSetting();
    }

    if (this.shouldRegisterTool('getCameraSetting')) {
      this.registerGetCameraSetting();
    }

    if (this.shouldRegisterTool('setCameraSetting')) {
      this.registerSetCameraSetting();
    }

    if (this.shouldRegisterTool('clearCameraSetting')) {
      this.registerClearCameraSetting();
    }

    if (this.shouldRegisterTool('getMicrophoneSetting')) {
      this.registerGetMicrophoneSetting();
    }

    if (this.shouldRegisterTool('setMicrophoneSetting')) {
      this.registerSetMicrophoneSetting();
    }

    if (this.shouldRegisterTool('clearMicrophoneSetting')) {
      this.registerClearMicrophoneSetting();
    }

    if (this.shouldRegisterTool('getAutomaticDownloadsSetting')) {
      this.registerGetAutomaticDownloadsSetting();
    }

    if (this.shouldRegisterTool('setAutomaticDownloadsSetting')) {
      this.registerSetAutomaticDownloadsSetting();
    }

    if (this.shouldRegisterTool('clearAutomaticDownloadsSetting')) {
      this.registerClearAutomaticDownloadsSetting();
    }

    if (this.shouldRegisterTool('getClipboardSetting')) {
      this.registerGetClipboardSetting();
    }

    if (this.shouldRegisterTool('setClipboardSetting')) {
      this.registerSetClipboardSetting();
    }

    if (this.shouldRegisterTool('clearClipboardSetting')) {
      this.registerClearClipboardSetting();
    }

    if (this.shouldRegisterTool('getAutoVerifySetting')) {
      this.registerGetAutoVerifySetting();
    }

    if (this.shouldRegisterTool('setAutoVerifySetting')) {
      this.registerSetAutoVerifySetting();
    }

    if (this.shouldRegisterTool('clearAutoVerifySetting')) {
      this.registerClearAutoVerifySetting();
    }

    if (this.shouldRegisterTool('getPluginsResourceIdentifiers')) {
      this.registerGetPluginsResourceIdentifiers();
    }
  }

  private registerGetCookiesSetting(): void {
    this.server.registerTool(
      'extension_tool_get_cookies_setting',
      {
        description: 'Get the current cookies content setting for a given pair of URLs',
        inputSchema: {
          primaryUrl: z
            .string()
            .describe('The primary URL for which the content setting should be retrieved'),
          secondaryUrl: z
            .string()
            .optional()
            .describe('The secondary URL for which the content setting should be retrieved'),
          incognito: z
            .boolean()
            .optional()
            .describe('Whether to check the content settings for an incognito session'),
          resourceIdentifier: z
            .object({
              id: z.string(),
              description: z.string().optional(),
            })
            .optional()
            .describe('A more specific identifier of the type of content'),
        },
      },
      async ({ primaryUrl, secondaryUrl, incognito, resourceIdentifier }) => {
        try {
          const details: any = { primaryUrl };
          if (secondaryUrl !== undefined) details.secondaryUrl = secondaryUrl;
          if (incognito !== undefined) details.incognito = incognito;
          if (resourceIdentifier !== undefined) details.resourceIdentifier = resourceIdentifier;

          const result = await new Promise<{ setting: string }>((resolve, reject) => {
            chrome.contentSettings.cookies.get(details, (result) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(result);
              }
            });
          });

          return this.formatJson({
            primaryUrl,
            secondaryUrl,
            incognito: incognito || false,
            setting: result.setting,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetCookiesSetting(): void {
    this.server.registerTool(
      'extension_tool_set_cookies_setting',
      {
        description: 'Set a new cookies content setting rule',
        inputSchema: {
          primaryPattern: z.string().describe('The pattern for the primary URL'),
          secondaryPattern: z.string().optional().describe('The pattern for the secondary URL'),
          setting: z.enum(['allow', 'block', 'session_only']).describe('The setting to apply'),
          scope: z
            .enum(['regular', 'incognito_session_only'])
            .optional()
            .describe('Where to set the setting'),
          resourceIdentifier: z
            .object({
              id: z.string(),
              description: z.string().optional(),
            })
            .optional()
            .describe('The resource identifier for the content type'),
        },
      },
      async ({ primaryPattern, secondaryPattern, setting, scope, resourceIdentifier }) => {
        try {
          const details: any = { primaryPattern, setting };
          if (secondaryPattern !== undefined) details.secondaryPattern = secondaryPattern;
          if (scope !== undefined) details.scope = scope;
          if (resourceIdentifier !== undefined) details.resourceIdentifier = resourceIdentifier;

          await new Promise<void>((resolve, reject) => {
            chrome.contentSettings.cookies.set(details, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Cookies content setting rule applied successfully', {
            primaryPattern,
            secondaryPattern,
            setting,
            scope: scope || 'regular',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerClearCookiesSetting(): void {
    this.server.registerTool(
      'extension_tool_clear_cookies_setting',
      {
        description: 'Clear all cookies content setting rules set by this extension',
        inputSchema: {
          scope: z
            .enum(['regular', 'incognito_session_only'])
            .optional()
            .describe('Where to clear the setting'),
        },
      },
      async ({ scope }) => {
        try {
          const details: any = {};
          if (scope !== undefined) details.scope = scope;

          await new Promise<void>((resolve, reject) => {
            chrome.contentSettings.cookies.clear(details, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('All cookies content setting rules cleared successfully', {
            scope: scope || 'regular',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetJavascriptSetting(): void {
    this.server.registerTool(
      'extension_tool_get_javascript_setting',
      {
        description: 'Get the current JavaScript content setting for a given pair of URLs',
        inputSchema: {
          primaryUrl: z
            .string()
            .describe('The primary URL for which the content setting should be retrieved'),
          secondaryUrl: z
            .string()
            .optional()
            .describe('The secondary URL for which the content setting should be retrieved'),
          incognito: z
            .boolean()
            .optional()
            .describe('Whether to check the content settings for an incognito session'),
          resourceIdentifier: z
            .object({
              id: z.string(),
              description: z.string().optional(),
            })
            .optional()
            .describe('A more specific identifier of the type of content'),
        },
      },
      async ({ primaryUrl, secondaryUrl, incognito, resourceIdentifier }) => {
        try {
          const details: any = { primaryUrl };
          if (secondaryUrl !== undefined) details.secondaryUrl = secondaryUrl;
          if (incognito !== undefined) details.incognito = incognito;
          if (resourceIdentifier !== undefined) details.resourceIdentifier = resourceIdentifier;

          const result = await new Promise<{ setting: string }>((resolve, reject) => {
            chrome.contentSettings.javascript.get(details, (result) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(result);
              }
            });
          });

          return this.formatJson({
            primaryUrl,
            secondaryUrl,
            incognito: incognito || false,
            setting: result.setting,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetJavascriptSetting(): void {
    this.server.registerTool(
      'extension_tool_set_javascript_setting',
      {
        description: 'Set a new JavaScript content setting rule',
        inputSchema: {
          primaryPattern: z.string().describe('The pattern for the primary URL'),
          secondaryPattern: z.string().optional().describe('The pattern for the secondary URL'),
          setting: z.enum(['allow', 'block']).describe('The setting to apply'),
          scope: z
            .enum(['regular', 'incognito_session_only'])
            .optional()
            .describe('Where to set the setting'),
          resourceIdentifier: z
            .object({
              id: z.string(),
              description: z.string().optional(),
            })
            .optional()
            .describe('The resource identifier for the content type'),
        },
      },
      async ({ primaryPattern, secondaryPattern, setting, scope, resourceIdentifier }) => {
        try {
          const details: any = { primaryPattern, setting };
          if (secondaryPattern !== undefined) details.secondaryPattern = secondaryPattern;
          if (scope !== undefined) details.scope = scope;
          if (resourceIdentifier !== undefined) details.resourceIdentifier = resourceIdentifier;

          await new Promise<void>((resolve, reject) => {
            chrome.contentSettings.javascript.set(details, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('JavaScript content setting rule applied successfully', {
            primaryPattern,
            secondaryPattern,
            setting,
            scope: scope || 'regular',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerClearJavascriptSetting(): void {
    this.server.registerTool(
      'extension_tool_clear_javascript_setting',
      {
        description: 'Clear all JavaScript content setting rules set by this extension',
        inputSchema: {
          scope: z
            .enum(['regular', 'incognito_session_only'])
            .optional()
            .describe('Where to clear the setting'),
        },
      },
      async ({ scope }) => {
        try {
          const details: any = {};
          if (scope !== undefined) details.scope = scope;

          await new Promise<void>((resolve, reject) => {
            chrome.contentSettings.javascript.clear(details, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('All JavaScript content setting rules cleared successfully', {
            scope: scope || 'regular',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetImagesSetting(): void {
    this.server.registerTool(
      'extension_tool_get_images_setting',
      {
        description: 'Get the current images content setting for a given pair of URLs',
        inputSchema: {
          primaryUrl: z
            .string()
            .describe('The primary URL for which the content setting should be retrieved'),
          secondaryUrl: z
            .string()
            .optional()
            .describe('The secondary URL for which the content setting should be retrieved'),
          incognito: z
            .boolean()
            .optional()
            .describe('Whether to check the content settings for an incognito session'),
          resourceIdentifier: z
            .object({
              id: z.string(),
              description: z.string().optional(),
            })
            .optional()
            .describe('A more specific identifier of the type of content'),
        },
      },
      async ({ primaryUrl, secondaryUrl, incognito, resourceIdentifier }) => {
        try {
          const details: any = { primaryUrl };
          if (secondaryUrl !== undefined) details.secondaryUrl = secondaryUrl;
          if (incognito !== undefined) details.incognito = incognito;
          if (resourceIdentifier !== undefined) details.resourceIdentifier = resourceIdentifier;

          const result = await new Promise<{ setting: string }>((resolve, reject) => {
            chrome.contentSettings.images.get(details, (result) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(result);
              }
            });
          });

          return this.formatJson({
            primaryUrl,
            secondaryUrl,
            incognito: incognito || false,
            setting: result.setting,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetImagesSetting(): void {
    this.server.registerTool(
      'extension_tool_set_images_setting',
      {
        description: 'Set a new images content setting rule',
        inputSchema: {
          primaryPattern: z.string().describe('The pattern for the primary URL'),
          secondaryPattern: z.string().optional().describe('The pattern for the secondary URL'),
          setting: z.enum(['allow', 'block']).describe('The setting to apply'),
          scope: z
            .enum(['regular', 'incognito_session_only'])
            .optional()
            .describe('Where to set the setting'),
          resourceIdentifier: z
            .object({
              id: z.string(),
              description: z.string().optional(),
            })
            .optional()
            .describe('The resource identifier for the content type'),
        },
      },
      async ({ primaryPattern, secondaryPattern, setting, scope, resourceIdentifier }) => {
        try {
          const details: any = { primaryPattern, setting };
          if (secondaryPattern !== undefined) details.secondaryPattern = secondaryPattern;
          if (scope !== undefined) details.scope = scope;
          if (resourceIdentifier !== undefined) details.resourceIdentifier = resourceIdentifier;

          await new Promise<void>((resolve, reject) => {
            chrome.contentSettings.images.set(details, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Images content setting rule applied successfully', {
            primaryPattern,
            secondaryPattern,
            setting,
            scope: scope || 'regular',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerClearImagesSetting(): void {
    this.server.registerTool(
      'extension_tool_clear_images_setting',
      {
        description: 'Clear all images content setting rules set by this extension',
        inputSchema: {
          scope: z
            .enum(['regular', 'incognito_session_only'])
            .optional()
            .describe('Where to clear the setting'),
        },
      },
      async ({ scope }) => {
        try {
          const details: any = {};
          if (scope !== undefined) details.scope = scope;

          await new Promise<void>((resolve, reject) => {
            chrome.contentSettings.images.clear(details, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('All images content setting rules cleared successfully', {
            scope: scope || 'regular',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetLocationSetting(): void {
    this.server.registerTool(
      'extension_tool_get_location_setting',
      {
        description: 'Get the current location content setting for a given pair of URLs',
        inputSchema: {
          primaryUrl: z
            .string()
            .describe('The primary URL for which the content setting should be retrieved'),
          secondaryUrl: z
            .string()
            .optional()
            .describe('The secondary URL for which the content setting should be retrieved'),
          incognito: z
            .boolean()
            .optional()
            .describe('Whether to check the content settings for an incognito session'),
          resourceIdentifier: z
            .object({
              id: z.string(),
              description: z.string().optional(),
            })
            .optional()
            .describe('A more specific identifier of the type of content'),
        },
      },
      async ({ primaryUrl, secondaryUrl, incognito, resourceIdentifier }) => {
        try {
          const details: any = { primaryUrl };
          if (secondaryUrl !== undefined) details.secondaryUrl = secondaryUrl;
          if (incognito !== undefined) details.incognito = incognito;
          if (resourceIdentifier !== undefined) details.resourceIdentifier = resourceIdentifier;

          const result = await new Promise<{ setting: string }>((resolve, reject) => {
            chrome.contentSettings.location.get(details, (result) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(result);
              }
            });
          });

          return this.formatJson({
            primaryUrl,
            secondaryUrl,
            incognito: incognito || false,
            setting: result.setting,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetLocationSetting(): void {
    this.server.registerTool(
      'extension_tool_set_location_setting',
      {
        description: 'Set a new location content setting rule',
        inputSchema: {
          primaryPattern: z.string().describe('The pattern for the primary URL'),
          secondaryPattern: z.string().optional().describe('The pattern for the secondary URL'),
          setting: z.enum(['allow', 'block', 'ask']).describe('The setting to apply'),
          scope: z
            .enum(['regular', 'incognito_session_only'])
            .optional()
            .describe('Where to set the setting'),
          resourceIdentifier: z
            .object({
              id: z.string(),
              description: z.string().optional(),
            })
            .optional()
            .describe('The resource identifier for the content type'),
        },
      },
      async ({ primaryPattern, secondaryPattern, setting, scope, resourceIdentifier }) => {
        try {
          const details: any = { primaryPattern, setting };
          if (secondaryPattern !== undefined) details.secondaryPattern = secondaryPattern;
          if (scope !== undefined) details.scope = scope;
          if (resourceIdentifier !== undefined) details.resourceIdentifier = resourceIdentifier;

          await new Promise<void>((resolve, reject) => {
            chrome.contentSettings.location.set(details, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Location content setting rule applied successfully', {
            primaryPattern,
            secondaryPattern,
            setting,
            scope: scope || 'regular',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerClearLocationSetting(): void {
    this.server.registerTool(
      'extension_tool_clear_location_setting',
      {
        description: 'Clear all location content setting rules set by this extension',
        inputSchema: {
          scope: z
            .enum(['regular', 'incognito_session_only'])
            .optional()
            .describe('Where to clear the setting'),
        },
      },
      async ({ scope }) => {
        try {
          const details: any = {};
          if (scope !== undefined) details.scope = scope;

          await new Promise<void>((resolve, reject) => {
            chrome.contentSettings.location.clear(details, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('All location content setting rules cleared successfully', {
            scope: scope || 'regular',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetNotificationsSetting(): void {
    this.server.registerTool(
      'extension_tool_get_notifications_setting',
      {
        description: 'Get the current notifications content setting for a given pair of URLs',
        inputSchema: {
          primaryUrl: z
            .string()
            .describe('The primary URL for which the content setting should be retrieved'),
          secondaryUrl: z
            .string()
            .optional()
            .describe('The secondary URL for which the content setting should be retrieved'),
          incognito: z
            .boolean()
            .optional()
            .describe('Whether to check the content settings for an incognito session'),
          resourceIdentifier: z
            .object({
              id: z.string(),
              description: z.string().optional(),
            })
            .optional()
            .describe('A more specific identifier of the type of content'),
        },
      },
      async ({ primaryUrl, secondaryUrl, incognito, resourceIdentifier }) => {
        try {
          const details: any = { primaryUrl };
          if (secondaryUrl !== undefined) details.secondaryUrl = secondaryUrl;
          if (incognito !== undefined) details.incognito = incognito;
          if (resourceIdentifier !== undefined) details.resourceIdentifier = resourceIdentifier;

          const result = await new Promise<{ setting: string }>((resolve, reject) => {
            chrome.contentSettings.notifications.get(details, (result) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(result);
              }
            });
          });

          return this.formatJson({
            primaryUrl,
            secondaryUrl,
            incognito: incognito || false,
            setting: result.setting,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetNotificationsSetting(): void {
    this.server.registerTool(
      'extension_tool_set_notifications_setting',
      {
        description: 'Set a new notifications content setting rule',
        inputSchema: {
          primaryPattern: z.string().describe('The pattern for the primary URL'),
          secondaryPattern: z.string().optional().describe('The pattern for the secondary URL'),
          setting: z.enum(['allow', 'block', 'ask']).describe('The setting to apply'),
          scope: z
            .enum(['regular', 'incognito_session_only'])
            .optional()
            .describe('Where to set the setting'),
          resourceIdentifier: z
            .object({
              id: z.string(),
              description: z.string().optional(),
            })
            .optional()
            .describe('The resource identifier for the content type'),
        },
      },
      async ({ primaryPattern, secondaryPattern, setting, scope, resourceIdentifier }) => {
        try {
          const details: any = { primaryPattern, setting };
          if (secondaryPattern !== undefined) details.secondaryPattern = secondaryPattern;
          if (scope !== undefined) details.scope = scope;
          if (resourceIdentifier !== undefined) details.resourceIdentifier = resourceIdentifier;

          await new Promise<void>((resolve, reject) => {
            chrome.contentSettings.notifications.set(details, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Notifications content setting rule applied successfully', {
            primaryPattern,
            secondaryPattern,
            setting,
            scope: scope || 'regular',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerClearNotificationsSetting(): void {
    this.server.registerTool(
      'extension_tool_clear_notifications_setting',
      {
        description: 'Clear all notifications content setting rules set by this extension',
        inputSchema: {
          scope: z
            .enum(['regular', 'incognito_session_only'])
            .optional()
            .describe('Where to clear the setting'),
        },
      },
      async ({ scope }) => {
        try {
          const details: any = {};
          if (scope !== undefined) details.scope = scope;

          await new Promise<void>((resolve, reject) => {
            chrome.contentSettings.notifications.clear(details, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess(
            'All notifications content setting rules cleared successfully',
            {
              scope: scope || 'regular',
            }
          );
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetPopupsSetting(): void {
    this.server.registerTool(
      'extension_tool_get_popups_setting',
      {
        description: 'Get the current popups content setting for a given pair of URLs',
        inputSchema: {
          primaryUrl: z
            .string()
            .describe('The primary URL for which the content setting should be retrieved'),
          secondaryUrl: z
            .string()
            .optional()
            .describe('The secondary URL for which the content setting should be retrieved'),
          incognito: z
            .boolean()
            .optional()
            .describe('Whether to check the content settings for an incognito session'),
          resourceIdentifier: z
            .object({
              id: z.string(),
              description: z.string().optional(),
            })
            .optional()
            .describe('A more specific identifier of the type of content'),
        },
      },
      async ({ primaryUrl, secondaryUrl, incognito, resourceIdentifier }) => {
        try {
          const details: any = { primaryUrl };
          if (secondaryUrl !== undefined) details.secondaryUrl = secondaryUrl;
          if (incognito !== undefined) details.incognito = incognito;
          if (resourceIdentifier !== undefined) details.resourceIdentifier = resourceIdentifier;

          const result = await new Promise<{ setting: string }>((resolve, reject) => {
            chrome.contentSettings.popups.get(details, (result) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(result);
              }
            });
          });

          return this.formatJson({
            primaryUrl,
            secondaryUrl,
            incognito: incognito || false,
            setting: result.setting,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetPopupsSetting(): void {
    this.server.registerTool(
      'extension_tool_set_popups_setting',
      {
        description: 'Set a new popups content setting rule',
        inputSchema: {
          primaryPattern: z.string().describe('The pattern for the primary URL'),
          secondaryPattern: z.string().optional().describe('The pattern for the secondary URL'),
          setting: z.enum(['allow', 'block']).describe('The setting to apply'),
          scope: z
            .enum(['regular', 'incognito_session_only'])
            .optional()
            .describe('Where to set the setting'),
          resourceIdentifier: z
            .object({
              id: z.string(),
              description: z.string().optional(),
            })
            .optional()
            .describe('The resource identifier for the content type'),
        },
      },
      async ({ primaryPattern, secondaryPattern, setting, scope, resourceIdentifier }) => {
        try {
          const details: any = { primaryPattern, setting };
          if (secondaryPattern !== undefined) details.secondaryPattern = secondaryPattern;
          if (scope !== undefined) details.scope = scope;
          if (resourceIdentifier !== undefined) details.resourceIdentifier = resourceIdentifier;

          await new Promise<void>((resolve, reject) => {
            chrome.contentSettings.popups.set(details, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Popups content setting rule applied successfully', {
            primaryPattern,
            secondaryPattern,
            setting,
            scope: scope || 'regular',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerClearPopupsSetting(): void {
    this.server.registerTool(
      'extension_tool_clear_popups_setting',
      {
        description: 'Clear all popups content setting rules set by this extension',
        inputSchema: {
          scope: z
            .enum(['regular', 'incognito_session_only'])
            .optional()
            .describe('Where to clear the setting'),
        },
      },
      async ({ scope }) => {
        try {
          const details: any = {};
          if (scope !== undefined) details.scope = scope;

          await new Promise<void>((resolve, reject) => {
            chrome.contentSettings.popups.clear(details, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('All popups content setting rules cleared successfully', {
            scope: scope || 'regular',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetCameraSetting(): void {
    this.server.registerTool(
      'extension_tool_get_camera_setting',
      {
        description: 'Get the current camera content setting for a given pair of URLs',
        inputSchema: {
          primaryUrl: z
            .string()
            .describe('The primary URL for which the content setting should be retrieved'),
          secondaryUrl: z
            .string()
            .optional()
            .describe('The secondary URL for which the content setting should be retrieved'),
          incognito: z
            .boolean()
            .optional()
            .describe('Whether to check the content settings for an incognito session'),
          resourceIdentifier: z
            .object({
              id: z.string(),
              description: z.string().optional(),
            })
            .optional()
            .describe('A more specific identifier of the type of content'),
        },
      },
      async ({ primaryUrl, secondaryUrl, incognito, resourceIdentifier }) => {
        try {
          const details: any = { primaryUrl };
          if (secondaryUrl !== undefined) details.secondaryUrl = secondaryUrl;
          if (incognito !== undefined) details.incognito = incognito;
          if (resourceIdentifier !== undefined) details.resourceIdentifier = resourceIdentifier;

          const result = await new Promise<{ setting: string }>((resolve, reject) => {
            chrome.contentSettings.camera.get(details, (result) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(result);
              }
            });
          });

          return this.formatJson({
            primaryUrl,
            secondaryUrl,
            incognito: incognito || false,
            setting: result.setting,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetCameraSetting(): void {
    this.server.registerTool(
      'extension_tool_set_camera_setting',
      {
        description: 'Set a new camera content setting rule',
        inputSchema: {
          primaryPattern: z.string().describe('The pattern for the primary URL'),
          secondaryPattern: z.string().optional().describe('The pattern for the secondary URL'),
          setting: z.enum(['allow', 'block', 'ask']).describe('The setting to apply'),
          scope: z
            .enum(['regular', 'incognito_session_only'])
            .optional()
            .describe('Where to set the setting'),
          resourceIdentifier: z
            .object({
              id: z.string(),
              description: z.string().optional(),
            })
            .optional()
            .describe('The resource identifier for the content type'),
        },
      },
      async ({ primaryPattern, secondaryPattern, setting, scope, resourceIdentifier }) => {
        try {
          const details: any = { primaryPattern, setting };
          if (secondaryPattern !== undefined) details.secondaryPattern = secondaryPattern;
          if (scope !== undefined) details.scope = scope;
          if (resourceIdentifier !== undefined) details.resourceIdentifier = resourceIdentifier;

          await new Promise<void>((resolve, reject) => {
            chrome.contentSettings.camera.set(details, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Camera content setting rule applied successfully', {
            primaryPattern,
            secondaryPattern,
            setting,
            scope: scope || 'regular',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerClearCameraSetting(): void {
    this.server.registerTool(
      'extension_tool_clear_camera_setting',
      {
        description: 'Clear all camera content setting rules set by this extension',
        inputSchema: {
          scope: z
            .enum(['regular', 'incognito_session_only'])
            .optional()
            .describe('Where to clear the setting'),
        },
      },
      async ({ scope }) => {
        try {
          const details: any = {};
          if (scope !== undefined) details.scope = scope;

          await new Promise<void>((resolve, reject) => {
            chrome.contentSettings.camera.clear(details, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('All camera content setting rules cleared successfully', {
            scope: scope || 'regular',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetMicrophoneSetting(): void {
    this.server.registerTool(
      'extension_tool_get_microphone_setting',
      {
        description: 'Get the current microphone content setting for a given pair of URLs',
        inputSchema: {
          primaryUrl: z
            .string()
            .describe('The primary URL for which the content setting should be retrieved'),
          secondaryUrl: z
            .string()
            .optional()
            .describe('The secondary URL for which the content setting should be retrieved'),
          incognito: z
            .boolean()
            .optional()
            .describe('Whether to check the content settings for an incognito session'),
          resourceIdentifier: z
            .object({
              id: z.string(),
              description: z.string().optional(),
            })
            .optional()
            .describe('A more specific identifier of the type of content'),
        },
      },
      async ({ primaryUrl, secondaryUrl, incognito, resourceIdentifier }) => {
        try {
          const details: any = { primaryUrl };
          if (secondaryUrl !== undefined) details.secondaryUrl = secondaryUrl;
          if (incognito !== undefined) details.incognito = incognito;
          if (resourceIdentifier !== undefined) details.resourceIdentifier = resourceIdentifier;

          const result = await new Promise<{ setting: string }>((resolve, reject) => {
            chrome.contentSettings.microphone.get(details, (result) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(result);
              }
            });
          });

          return this.formatJson({
            primaryUrl,
            secondaryUrl,
            incognito: incognito || false,
            setting: result.setting,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetMicrophoneSetting(): void {
    this.server.registerTool(
      'extension_tool_set_microphone_setting',
      {
        description: 'Set a new microphone content setting rule',
        inputSchema: {
          primaryPattern: z.string().describe('The pattern for the primary URL'),
          secondaryPattern: z.string().optional().describe('The pattern for the secondary URL'),
          setting: z.enum(['allow', 'block', 'ask']).describe('The setting to apply'),
          scope: z
            .enum(['regular', 'incognito_session_only'])
            .optional()
            .describe('Where to set the setting'),
          resourceIdentifier: z
            .object({
              id: z.string(),
              description: z.string().optional(),
            })
            .optional()
            .describe('The resource identifier for the content type'),
        },
      },
      async ({ primaryPattern, secondaryPattern, setting, scope, resourceIdentifier }) => {
        try {
          const details: any = { primaryPattern, setting };
          if (secondaryPattern !== undefined) details.secondaryPattern = secondaryPattern;
          if (scope !== undefined) details.scope = scope;
          if (resourceIdentifier !== undefined) details.resourceIdentifier = resourceIdentifier;

          await new Promise<void>((resolve, reject) => {
            chrome.contentSettings.microphone.set(details, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Microphone content setting rule applied successfully', {
            primaryPattern,
            secondaryPattern,
            setting,
            scope: scope || 'regular',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerClearMicrophoneSetting(): void {
    this.server.registerTool(
      'extension_tool_clear_microphone_setting',
      {
        description: 'Clear all microphone content setting rules set by this extension',
        inputSchema: {
          scope: z
            .enum(['regular', 'incognito_session_only'])
            .optional()
            .describe('Where to clear the setting'),
        },
      },
      async ({ scope }) => {
        try {
          const details: any = {};
          if (scope !== undefined) details.scope = scope;

          await new Promise<void>((resolve, reject) => {
            chrome.contentSettings.microphone.clear(details, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('All microphone content setting rules cleared successfully', {
            scope: scope || 'regular',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetAutomaticDownloadsSetting(): void {
    this.server.registerTool(
      'extension_tool_get_automatic_downloads_setting',
      {
        description: 'Get the current automatic downloads content setting for a given pair of URLs',
        inputSchema: {
          primaryUrl: z
            .string()
            .describe('The primary URL for which the content setting should be retrieved'),
          secondaryUrl: z
            .string()
            .optional()
            .describe('The secondary URL for which the content setting should be retrieved'),
          incognito: z
            .boolean()
            .optional()
            .describe('Whether to check the content settings for an incognito session'),
          resourceIdentifier: z
            .object({
              id: z.string(),
              description: z.string().optional(),
            })
            .optional()
            .describe('A more specific identifier of the type of content'),
        },
      },
      async ({ primaryUrl, secondaryUrl, incognito, resourceIdentifier }) => {
        try {
          const details: any = { primaryUrl };
          if (secondaryUrl !== undefined) details.secondaryUrl = secondaryUrl;
          if (incognito !== undefined) details.incognito = incognito;
          if (resourceIdentifier !== undefined) details.resourceIdentifier = resourceIdentifier;

          const result = await new Promise<{ setting: string }>((resolve, reject) => {
            chrome.contentSettings.automaticDownloads.get(details, (result) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(result);
              }
            });
          });

          return this.formatJson({
            primaryUrl,
            secondaryUrl,
            incognito: incognito || false,
            setting: result.setting,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetAutomaticDownloadsSetting(): void {
    this.server.registerTool(
      'extension_tool_set_automatic_downloads_setting',
      {
        description: 'Set a new automatic downloads content setting rule',
        inputSchema: {
          primaryPattern: z.string().describe('The pattern for the primary URL'),
          secondaryPattern: z.string().optional().describe('The pattern for the secondary URL'),
          setting: z.enum(['allow', 'block', 'ask']).describe('The setting to apply'),
          scope: z
            .enum(['regular', 'incognito_session_only'])
            .optional()
            .describe('Where to set the setting'),
          resourceIdentifier: z
            .object({
              id: z.string(),
              description: z.string().optional(),
            })
            .optional()
            .describe('The resource identifier for the content type'),
        },
      },
      async ({ primaryPattern, secondaryPattern, setting, scope, resourceIdentifier }) => {
        try {
          const details: any = { primaryPattern, setting };
          if (secondaryPattern !== undefined) details.secondaryPattern = secondaryPattern;
          if (scope !== undefined) details.scope = scope;
          if (resourceIdentifier !== undefined) details.resourceIdentifier = resourceIdentifier;

          await new Promise<void>((resolve, reject) => {
            chrome.contentSettings.automaticDownloads.set(details, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess(
            'Automatic downloads content setting rule applied successfully',
            {
              primaryPattern,
              secondaryPattern,
              setting,
              scope: scope || 'regular',
            }
          );
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerClearAutomaticDownloadsSetting(): void {
    this.server.registerTool(
      'extension_tool_clear_automatic_downloads_setting',
      {
        description: 'Clear all automatic downloads content setting rules set by this extension',
        inputSchema: {
          scope: z
            .enum(['regular', 'incognito_session_only'])
            .optional()
            .describe('Where to clear the setting'),
        },
      },
      async ({ scope }) => {
        try {
          const details: any = {};
          if (scope !== undefined) details.scope = scope;

          await new Promise<void>((resolve, reject) => {
            chrome.contentSettings.automaticDownloads.clear(details, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess(
            'All automatic downloads content setting rules cleared successfully',
            {
              scope: scope || 'regular',
            }
          );
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetClipboardSetting(): void {
    this.server.registerTool(
      'extension_tool_get_clipboard_setting',
      {
        description: 'Get the current clipboard content setting for a given pair of URLs',
        inputSchema: {
          primaryUrl: z
            .string()
            .describe('The primary URL for which the content setting should be retrieved'),
          secondaryUrl: z
            .string()
            .optional()
            .describe('The secondary URL for which the content setting should be retrieved'),
          incognito: z
            .boolean()
            .optional()
            .describe('Whether to check the content settings for an incognito session'),
          resourceIdentifier: z
            .object({
              id: z.string(),
              description: z.string().optional(),
            })
            .optional()
            .describe('A more specific identifier of the type of content'),
        },
      },
      async ({ primaryUrl, secondaryUrl, incognito, resourceIdentifier }) => {
        try {
          const details: any = { primaryUrl };
          if (secondaryUrl !== undefined) details.secondaryUrl = secondaryUrl;
          if (incognito !== undefined) details.incognito = incognito;
          if (resourceIdentifier !== undefined) details.resourceIdentifier = resourceIdentifier;

          const result = await new Promise<{ setting: string }>((resolve, reject) => {
            chrome.contentSettings.clipboard.get(details, (result) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(result);
              }
            });
          });

          return this.formatJson({
            primaryUrl,
            secondaryUrl,
            incognito: incognito || false,
            setting: result.setting,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetClipboardSetting(): void {
    this.server.registerTool(
      'extension_tool_set_clipboard_setting',
      {
        description: 'Set a new clipboard content setting rule',
        inputSchema: {
          primaryPattern: z.string().describe('The pattern for the primary URL'),
          secondaryPattern: z.string().optional().describe('The pattern for the secondary URL'),
          setting: z.enum(['allow', 'block', 'ask']).describe('The setting to apply'),
          scope: z
            .enum(['regular', 'incognito_session_only'])
            .optional()
            .describe('Where to set the setting'),
          resourceIdentifier: z
            .object({
              id: z.string(),
              description: z.string().optional(),
            })
            .optional()
            .describe('The resource identifier for the content type'),
        },
      },
      async ({ primaryPattern, secondaryPattern, setting, scope, resourceIdentifier }) => {
        try {
          const details: any = { primaryPattern, setting };
          if (secondaryPattern !== undefined) details.secondaryPattern = secondaryPattern;
          if (scope !== undefined) details.scope = scope;
          if (resourceIdentifier !== undefined) details.resourceIdentifier = resourceIdentifier;

          await new Promise<void>((resolve, reject) => {
            chrome.contentSettings.clipboard.set(details, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Clipboard content setting rule applied successfully', {
            primaryPattern,
            secondaryPattern,
            setting,
            scope: scope || 'regular',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerClearClipboardSetting(): void {
    this.server.registerTool(
      'extension_tool_clear_clipboard_setting',
      {
        description: 'Clear all clipboard content setting rules set by this extension',
        inputSchema: {
          scope: z
            .enum(['regular', 'incognito_session_only'])
            .optional()
            .describe('Where to clear the setting'),
        },
      },
      async ({ scope }) => {
        try {
          const details: any = {};
          if (scope !== undefined) details.scope = scope;

          await new Promise<void>((resolve, reject) => {
            chrome.contentSettings.clipboard.clear(details, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('All clipboard content setting rules cleared successfully', {
            scope: scope || 'regular',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetAutoVerifySetting(): void {
    this.server.registerTool(
      'extension_tool_get_auto_verify_setting',
      {
        description: 'Get the current auto verify content setting for a given pair of URLs',
        inputSchema: {
          primaryUrl: z
            .string()
            .describe('The primary URL for which the content setting should be retrieved'),
          secondaryUrl: z
            .string()
            .optional()
            .describe('The secondary URL for which the content setting should be retrieved'),
          incognito: z
            .boolean()
            .optional()
            .describe('Whether to check the content settings for an incognito session'),
          resourceIdentifier: z
            .object({
              id: z.string(),
              description: z.string().optional(),
            })
            .optional()
            .describe('A more specific identifier of the type of content'),
        },
      },
      async ({ primaryUrl, secondaryUrl, incognito, resourceIdentifier }) => {
        try {
          const details: any = { primaryUrl };
          if (secondaryUrl !== undefined) details.secondaryUrl = secondaryUrl;
          if (incognito !== undefined) details.incognito = incognito;
          if (resourceIdentifier !== undefined) details.resourceIdentifier = resourceIdentifier;

          const result = await new Promise<{ setting: string }>((resolve, reject) => {
            chrome.contentSettings.autoVerify.get(details, (result) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(result);
              }
            });
          });

          return this.formatJson({
            primaryUrl,
            secondaryUrl,
            incognito: incognito || false,
            setting: result.setting,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetAutoVerifySetting(): void {
    this.server.registerTool(
      'extension_tool_set_auto_verify_setting',
      {
        description: 'Set a new auto verify content setting rule',
        inputSchema: {
          primaryPattern: z.string().describe('The pattern for the primary URL'),
          secondaryPattern: z.string().optional().describe('The pattern for the secondary URL'),
          setting: z.enum(['allow', 'block']).describe('The setting to apply'),
          scope: z
            .enum(['regular', 'incognito_session_only'])
            .optional()
            .describe('Where to set the setting'),
          resourceIdentifier: z
            .object({
              id: z.string(),
              description: z.string().optional(),
            })
            .optional()
            .describe('The resource identifier for the content type'),
        },
      },
      async ({ primaryPattern, secondaryPattern, setting, scope, resourceIdentifier }) => {
        try {
          const details: any = { primaryPattern, setting };
          if (secondaryPattern !== undefined) details.secondaryPattern = secondaryPattern;
          if (scope !== undefined) details.scope = scope;
          if (resourceIdentifier !== undefined) details.resourceIdentifier = resourceIdentifier;

          await new Promise<void>((resolve, reject) => {
            chrome.contentSettings.autoVerify.set(details, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Auto verify content setting rule applied successfully', {
            primaryPattern,
            secondaryPattern,
            setting,
            scope: scope || 'regular',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerClearAutoVerifySetting(): void {
    this.server.registerTool(
      'extension_tool_clear_auto_verify_setting',
      {
        description: 'Clear all auto verify content setting rules set by this extension',
        inputSchema: {
          scope: z
            .enum(['regular', 'incognito_session_only'])
            .optional()
            .describe('Where to clear the setting'),
        },
      },
      async ({ scope }) => {
        try {
          const details: any = {};
          if (scope !== undefined) details.scope = scope;

          await new Promise<void>((resolve, reject) => {
            chrome.contentSettings.autoVerify.clear(details, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('All auto verify content setting rules cleared successfully', {
            scope: scope || 'regular',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetPluginsResourceIdentifiers(): void {
    this.server.registerTool(
      'extension_tool_get_plugins_resource_identifiers',
      {
        description: 'Get a list of resource identifiers for the plugins content type',
        inputSchema: {},
      },
      async () => {
        try {
          const resourceIdentifiers = await new Promise<
            chrome.contentSettings.ResourceIdentifier[] | undefined
          >((resolve, reject) => {
            chrome.contentSettings.plugins.getResourceIdentifiers((resourceIdentifiers) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(resourceIdentifiers);
              }
            });
          });

          return this.formatJson({
            count: resourceIdentifiers?.length || 0,
            resourceIdentifiers: resourceIdentifiers || [],
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
