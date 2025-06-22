import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface InstanceIDApiToolsOptions {
  getID?: boolean;
  getCreationTime?: boolean;
  getToken?: boolean;
  deleteToken?: boolean;
  deleteID?: boolean;
}

export class InstanceIDApiTools extends BaseApiTools {
  protected apiName = 'InstanceID';

  constructor(
    server: McpServer,
    options: InstanceIDApiToolsOptions = {}
  ) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.instanceID) {
        return {
          available: false,
          message: 'chrome.instanceID API is not defined',
          details: 'This extension needs the "gcm" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.instanceID.getID !== 'function') {
        return {
          available: false,
          message: 'chrome.instanceID.getID is not available',
          details: 'The instanceID API appears to be partially available. Check manifest permissions.',
        };
      }

      // Try to actually use the API
      chrome.instanceID.getID((_instanceID) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'InstanceID API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.instanceID API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('getID')) {
      this.registerGetID();
    }

    if (this.shouldRegisterTool('getCreationTime')) {
      this.registerGetCreationTime();
    }

    if (this.shouldRegisterTool('getToken')) {
      this.registerGetToken();
    }

    if (this.shouldRegisterTool('deleteToken')) {
      this.registerDeleteToken();
    }

    if (this.shouldRegisterTool('deleteID')) {
      this.registerDeleteID();
    }
  }

  private registerGetID(): void {
    this.server.registerTool(
      'get_instance_id',
      {
        description: 'Retrieve an identifier for the app instance. The same ID will be returned as long as the application identity has not been revoked or expired',
        inputSchema: {},
      },
      async () => {
        try {
          const instanceID = await new Promise<string>((resolve, reject) => {
            chrome.instanceID.getID((instanceID) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(instanceID);
              }
            });
          });

          return this.formatJson({
            instanceID: instanceID,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetCreationTime(): void {
    this.server.registerTool(
      'get_creation_time',
      {
        description: 'Retrieve the time when the InstanceID has been generated, represented in milliseconds since the epoch',
        inputSchema: {},
      },
      async () => {
        try {
          const creationTime = await new Promise<number>((resolve, reject) => {
            chrome.instanceID.getCreationTime((creationTime) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(creationTime);
              }
            });
          });

          return this.formatJson({
            creationTime: creationTime,
            creationTimeFormatted: new Date(creationTime).toISOString(),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetToken(): void {
    this.server.registerTool(
      'get_token',
      {
        description: 'Return a token that allows the authorized entity to access the service defined by scope',
        inputSchema: {
          authorizedEntity: z
            .string()
            .describe(
              'Identifies the entity that is authorized to access resources associated with this Instance ID. It can be a project ID from Google developer console'
            ),
          scope: z
            .string()
            .describe(
              'Identifies authorized actions that the authorized entity can take. E.g. for sending GCM messages, GCM scope should be used'
            ),
          options: z
            .record(z.string())
            .optional()
            .describe(
              'Optional key/value pairs that will be associated with the token (deprecated since Chrome 89)'
            ),
        },
      },
      async ({ authorizedEntity, scope, options }) => {
        try {
          const getTokenParams: any = {
            authorizedEntity: authorizedEntity,
            scope: scope,
          };

          if (options !== undefined) {
            getTokenParams.options = options;
          }

          const token = await new Promise<string>((resolve, reject) => {
            chrome.instanceID.getToken(getTokenParams, (token) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(token);
              }
            });
          });

          return this.formatJson({
            token: token,
            authorizedEntity: authorizedEntity,
            scope: scope,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerDeleteToken(): void {
    this.server.registerTool(
      'delete_token',
      {
        description: 'Revoke a granted token',
        inputSchema: {
          authorizedEntity: z
            .string()
            .describe('The authorized entity that is used to obtain the token'),
          scope: z.string().describe('The scope that is used to obtain the token'),
        },
      },
      async ({ authorizedEntity, scope }) => {
        try {
          const deleteTokenParams = {
            authorizedEntity: authorizedEntity,
            scope: scope,
          };

          await new Promise<void>((resolve, reject) => {
            chrome.instanceID.deleteToken(deleteTokenParams, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Token deleted successfully', {
            authorizedEntity: authorizedEntity,
            scope: scope,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerDeleteID(): void {
    this.server.registerTool(
      'delete_instance_id',
      {
        description: 'Reset the app instance identifier and revoke all tokens associated with it',
        inputSchema: {},
      },
      async () => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.instanceID.deleteID(() => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Instance ID deleted successfully and all associated tokens revoked');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}