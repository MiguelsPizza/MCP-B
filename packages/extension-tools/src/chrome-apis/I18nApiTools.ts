import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { type ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface I18nApiToolsOptions {
  getMessage?: boolean;
  getUILanguage?: boolean;
  getAcceptLanguages?: boolean;
  detectLanguage?: boolean;
}

export class I18nApiTools extends BaseApiTools {
  protected apiName = 'I18n';

  constructor(server: McpServer, options: I18nApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.i18n) {
        return {
          available: false,
          message: 'chrome.i18n API is not defined',
          details: 'The i18n API should be available by default in Chrome extensions',
        };
      }

      // Test a basic method
      if (typeof chrome.i18n.getMessage !== 'function') {
        return {
          available: false,
          message: 'chrome.i18n.getMessage is not available',
          details: 'The i18n API appears to be partially available. This is unexpected.',
        };
      }

      // Try to actually use the API
      const testMessage = chrome.i18n.getMessage('@@ui_locale');
      if (!testMessage) {
        return {
          available: false,
          message: 'Failed to get UI locale from chrome.i18n',
          details: 'The i18n API is not functioning properly',
        };
      }

      return {
        available: true,
        message: 'I18n API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.i18n API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('getMessage')) {
      this.registerGetMessage();
    }

    if (this.shouldRegisterTool('getUILanguage')) {
      this.registerGetUILanguage();
    }

    if (this.shouldRegisterTool('getAcceptLanguages')) {
      this.registerGetAcceptLanguages();
    }

    if (this.shouldRegisterTool('detectLanguage')) {
      this.registerDetectLanguage();
    }
  }

  private registerGetMessage(): void {
    this.server.registerTool(
      'extension_tool_get_message',
      {
        description:
          'Get a localized string for the specified message. Returns empty string if message is missing.',
        inputSchema: {
          messageName: z
            .string()
            .describe('The name of the message, as specified in the messages.json file'),
          substitutions: z
            .array(z.string())
            .max(9)
            .optional()
            .describe('Up to 9 substitution strings, if the message requires any'),
          escapeLt: z
            .boolean()
            .optional()
            .describe(
              'Escape < in translation to &lt;. Useful when translation is used in HTML context'
            ),
        },
      },
      async ({ messageName, substitutions, escapeLt }) => {
        try {
          const options: any = {};
          if (escapeLt !== undefined) {
            options.escapeLt = escapeLt;
          }

          let message: string;
          if (substitutions && substitutions.length > 0) {
            if (Object.keys(options).length > 0) {
              message = chrome.i18n.getMessage(messageName, substitutions);
            } else {
              message = chrome.i18n.getMessage(messageName, substitutions);
            }
          } else {
            if (Object.keys(options).length > 0) {
              message = chrome.i18n.getMessage(messageName, undefined);
            } else {
              message = chrome.i18n.getMessage(messageName);
            }
          }

          if (message === undefined) {
            return this.formatError('Invalid getMessage() call format');
          }

          return this.formatJson({
            messageName,
            message,
            isEmpty: message === '',
            substitutions: substitutions || [],
            options,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetUILanguage(): void {
    this.server.registerTool(
      'extension_tool_get_ui_language',
      {
        description:
          'Get the browser UI language. This is different from accept languages which returns preferred user languages.',
        inputSchema: {},
      },
      async () => {
        try {
          const uiLanguage = chrome.i18n.getUILanguage();

          return this.formatJson({
            uiLanguage,
            description: 'The browser UI language code such as en-US or fr-FR',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetAcceptLanguages(): void {
    this.server.registerTool(
      'extension_tool_get_accept_languages',
      {
        description:
          'Get the accept-languages of the browser. This is different from the locale used by the browser.',
        inputSchema: {},
      },
      async () => {
        try {
          const languages = await new Promise<string[]>((resolve, reject) => {
            chrome.i18n.getAcceptLanguages((languages) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(languages);
              }
            });
          });

          return this.formatJson({
            count: languages.length,
            languages,
            description: "Array of language codes representing user's preferred languages",
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerDetectLanguage(): void {
    this.server.registerTool(
      'extension_tool_detect_language',
      {
        description:
          'Detect the language of provided text using CLD (Compact Language Detector). Returns up to 3 detected languages.',
        inputSchema: {
          text: z
            .string()
            .min(1)
            .describe('User input string to be analyzed for language detection'),
        },
      },
      async ({ text }) => {
        try {
          const result = await new Promise<any>((resolve, reject) => {
            chrome.i18n.detectLanguage(text, (result) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(result);
              }
            });
          });

          return this.formatJson({
            inputText: text,
            isReliable: result.isReliable,
            detectedLanguages: result.languages.map((lang: any) => ({
              language: lang.language,
              percentage: lang.percentage,
              description:
                lang.language === 'und'
                  ? 'Unknown language'
                  : `ISO language code: ${lang.language}`,
            })),
            summary: {
              primaryLanguage: result.languages[0]?.language || 'unknown',
              primaryPercentage: result.languages[0]?.percentage || 0,
              totalLanguagesDetected: result.languages.length,
            },
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
