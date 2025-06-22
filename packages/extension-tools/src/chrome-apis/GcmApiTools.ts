import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface GcmApiToolsOptions {
  register?: boolean;
  send?: boolean;
  unregister?: boolean;
}

export class GcmApiTools extends BaseApiTools {
  protected apiName = 'Gcm';

  constructor(
    server: McpServer,
    options: GcmApiToolsOptions = {}
  ) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.gcm) {
        return {
          available: false,
          message: 'chrome.gcm API is not defined',
          details: 'This extension needs the "gcm" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.gcm.register !== 'function') {
        return {
          available: false,
          message: 'chrome.gcm.register is not available',
          details: 'The gcm API appears to be partially available. Check manifest permissions.',
        };
      }

      return {
        available: true,
        message: 'GCM API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.gcm API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('register')) {
      this.registerRegister();
    }

    if (this.shouldRegisterTool('send')) {
      this.registerSend();
    }

    if (this.shouldRegisterTool('unregister')) {
      this.registerUnregister();
    }
  }

  private registerRegister(): void {
    this.server.registerTool(
      'gcm_register',
      {
        description: 'Register the application with Firebase Cloud Messaging (FCM) to receive messages',
        inputSchema: {
          senderIds: z
            .array(z.string())
            .min(1)
            .max(100)
            .describe('A list of server IDs that are allowed to send messages to the application. Must contain at least one and no more than 100 sender IDs'),
        },
      },
      async ({ senderIds }) => {
        try {
          const registrationId = await new Promise<string>((resolve, reject) => {
            chrome.gcm.register(senderIds, (registrationId) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(registrationId);
              }
            });
          });

          return this.formatSuccess('Successfully registered with FCM', {
            registrationId,
            senderIds,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSend(): void {
    this.server.registerTool(
      'gcm_send',
      {
        description: 'Send a message through Firebase Cloud Messaging (FCM)',
        inputSchema: {
          destinationId: z
            .string()
            .describe('The ID of the server to send the message to as assigned by Google API Console'),
          messageId: z
            .string()
            .describe('The ID of the message. Must be unique for each message in scope of the application'),
          data: z
            .record(z.string())
            .describe('Message data to send to the server. Case-insensitive goog. and google, as well as case-sensitive collapse_key are disallowed as key prefixes'),
          timeToLive: z
            .number()
            .min(0)
            .max(2419200)
            .optional()
            .describe('Time-to-live of the message in seconds. 0 means send immediately or fail. Default is 86,400 seconds (1 day), maximum is 2,419,200 seconds (28 days)'),
        },
      },
      async ({ destinationId, messageId, data, timeToLive }) => {
        try {
          // Validate data size
          const dataSize = JSON.stringify(data).length;
          if (dataSize > 4096) {
            return this.formatError('Message data exceeds maximum size of 4096 bytes');
          }

          // Validate key prefixes
          for (const key of Object.keys(data)) {
            const lowerKey = key.toLowerCase();
            if (lowerKey.startsWith('goog.') || lowerKey.startsWith('google') || key === 'collapse_key') {
              return this.formatError(`Invalid key prefix: ${key}. Keys cannot start with 'goog.', 'google', or be 'collapse_key'`);
            }
          }

          const message: any = {
            destinationId,
            messageId,
            data,
          };

          if (timeToLive !== undefined) {
            message.timeToLive = timeToLive;
          }

          const sentMessageId = await new Promise<string>((resolve, reject) => {
            chrome.gcm.send(message, (messageId) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(messageId);
              }
            });
          });

          return this.formatSuccess('Message sent successfully', {
            messageId: sentMessageId,
            destinationId,
            dataSize,
            timeToLive: timeToLive || 86400,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerUnregister(): void {
    this.server.registerTool(
      'gcm_unregister',
      {
        description: 'Unregister the application from Firebase Cloud Messaging (FCM)',
        inputSchema: {},
      },
      async () => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.gcm.unregister(() => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Successfully unregistered from FCM');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}