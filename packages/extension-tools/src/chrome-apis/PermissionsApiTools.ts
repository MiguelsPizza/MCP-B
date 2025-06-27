import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface PermissionsApiToolsOptions {
  request?: boolean;
  contains?: boolean;
  getAll?: boolean;
  remove?: boolean;
  addHostAccessRequest?: boolean;
  removeHostAccessRequest?: boolean;
}

export class PermissionsApiTools extends BaseApiTools {
  protected apiName = 'Permissions';

  constructor(server: McpServer, options: PermissionsApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.permissions) {
        return {
          available: false,
          message: 'chrome.permissions API is not defined',
          details: 'This extension needs the "permissions" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.permissions.getAll !== 'function') {
        return {
          available: false,
          message: 'chrome.permissions.getAll is not available',
          details:
            'The permissions API appears to be partially available. Check manifest permissions.',
        };
      }

      // Try to actually use the API
      chrome.permissions.getAll((_permissions) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'Permissions API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.permissions API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('request')) {
      this.registerRequest();
    }

    if (this.shouldRegisterTool('contains')) {
      this.registerContains();
    }

    if (this.shouldRegisterTool('getAll')) {
      this.registerGetAll();
    }

    if (this.shouldRegisterTool('remove')) {
      this.registerRemove();
    }

    if (this.shouldRegisterTool('addHostAccessRequest')) {
      this.registerAddHostAccessRequest();
    }

    if (this.shouldRegisterTool('removeHostAccessRequest')) {
      this.registerRemoveHostAccessRequest();
    }
  }

  private registerRequest(): void {
    this.server.registerTool(
      'extension_tool_request_permissions',
      {
        description:
          'Request access to specified permissions, displaying a prompt to the user if necessary',
        inputSchema: {
          permissions: z
            .array(z.string())
            .optional()
            .describe('List of named permissions to request'),
          origins: z
            .array(z.string())
            .optional()
            .describe('List of host permissions to request (e.g., ["https://www.google.com/"])'),
        },
      },
      async ({ permissions, origins }) => {
        try {
          // Validate that at least one permission type is provided
          if (!permissions && !origins) {
            return this.formatError(
              'Either permissions or origins must be specified to request permissions'
            );
          }

          // Build permissions object
          const permissionsRequest: chrome.permissions.Permissions = {};

          if (permissions && permissions.length > 0) {
            permissionsRequest.permissions = permissions as chrome.runtime.ManifestPermissions[];
          }

          if (origins && origins.length > 0) {
            permissionsRequest.origins = origins;
          }

          // Request the permissions
          const granted = await new Promise<boolean>((resolve, reject) => {
            chrome.permissions.request(permissionsRequest, (granted) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(granted);
              }
            });
          });

          if (granted) {
            return this.formatSuccess('Permissions granted successfully', {
              permissions: permissions || [],
              origins: origins || [],
            });
          } else {
            return this.formatSuccess('Permissions request denied by user', {
              permissions: permissions || [],
              origins: origins || [],
            });
          }
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerContains(): void {
    this.server.registerTool(
      'extension_tool_contains_permissions',
      {
        description: 'Check if the extension has the specified permissions',
        inputSchema: {
          permissions: z
            .array(z.string())
            .optional()
            .describe('List of named permissions to check'),
          origins: z
            .array(z.string())
            .optional()
            .describe('List of host permissions to check (e.g., ["https://www.google.com/"])'),
        },
      },
      async ({ permissions, origins }) => {
        try {
          // Validate that at least one permission type is provided
          if (!permissions && !origins) {
            return this.formatError(
              'Either permissions or origins must be specified to check permissions'
            );
          }

          // Build permissions object
          const permissionsCheck: chrome.permissions.Permissions = {};

          if (permissions && permissions.length > 0) {
            permissionsCheck.permissions = permissions as chrome.runtime.ManifestPermissions[];
          }

          if (origins && origins.length > 0) {
            permissionsCheck.origins = origins;
          }

          // Check the permissions
          const hasPermissions = await new Promise<boolean>((resolve, reject) => {
            chrome.permissions.contains(permissionsCheck, (result) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(result);
              }
            });
          });

          return this.formatJson({
            hasPermissions,
            checkedPermissions: permissions || [],
            checkedOrigins: origins || [],
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetAll(): void {
    this.server.registerTool(
      'extension_tool_get_all_permissions',
      {
        description: "Get the extension's current set of permissions",
        inputSchema: {},
      },
      async () => {
        try {
          const allPermissions = await new Promise<chrome.permissions.Permissions>(
            (resolve, reject) => {
              chrome.permissions.getAll((permissions) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(permissions);
                }
              });
            }
          );

          return this.formatJson({
            permissions: allPermissions.permissions || [],
            origins: allPermissions.origins || [],
            permissionsCount: (allPermissions.permissions || []).length,
            originsCount: (allPermissions.origins || []).length,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerRemove(): void {
    this.server.registerTool(
      'extension_tool_remove_permissions',
      {
        description: 'Remove access to the specified permissions',
        inputSchema: {
          permissions: z
            .array(z.string())
            .optional()
            .describe('List of named permissions to remove'),
          origins: z
            .array(z.string())
            .optional()
            .describe('List of host permissions to remove (e.g., ["https://www.google.com/"])'),
        },
      },
      async ({ permissions, origins }) => {
        try {
          // Validate that at least one permission type is provided
          if (!permissions && !origins) {
            return this.formatError(
              'Either permissions or origins must be specified to remove permissions'
            );
          }

          // Build permissions object
          const permissionsRemove: chrome.permissions.Permissions = {};

          if (permissions && permissions.length > 0) {
            permissionsRemove.permissions = permissions as chrome.runtime.ManifestPermissions[];
          }

          if (origins && origins.length > 0) {
            permissionsRemove.origins = origins;
          }

          // Remove the permissions
          const removed = await new Promise<boolean>((resolve, reject) => {
            chrome.permissions.remove(permissionsRemove, (removed) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(removed);
              }
            });
          });

          if (removed) {
            return this.formatSuccess('Permissions removed successfully', {
              permissions: permissions || [],
              origins: origins || [],
            });
          } else {
            return this.formatSuccess(
              'Permissions could not be removed (may be required permissions)',
              {
                permissions: permissions || [],
                origins: origins || [],
              }
            );
          }
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerAddHostAccessRequest(): void {
    this.server.registerTool(
      'extension_tool_add_host_access_request',
      {
        description: 'Add a host access request that will be shown to the user',
        inputSchema: {
          tabId: z
            .number()
            .optional()
            .describe('The id of the tab where host access requests can be shown'),
          documentId: z
            .string()
            .optional()
            .describe('The id of a document where host access requests can be shown'),
          pattern: z
            .string()
            .optional()
            .describe('The URL pattern where host access requests can be shown'),
        },
      },
      async ({ tabId, documentId, pattern }) => {
        try {
          // Validate that either tabId or documentId is provided
          if (tabId === undefined && documentId === undefined) {
            return this.formatError(
              'Either tabId or documentId must be specified to add host access request'
            );
          }

          // Build request object
          const request: any = {};

          if (tabId !== undefined) {
            request.tabId = tabId;
          }

          if (documentId !== undefined) {
            request.documentId = documentId;
          }

          if (pattern !== undefined) {
            request.pattern = pattern;
          }

          // Add the host access request
          await new Promise<void>((resolve, reject) => {
            chrome.permissions.addHostAccessRequest(request, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Host access request added successfully', {
            tabId,
            documentId,
            pattern,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerRemoveHostAccessRequest(): void {
    this.server.registerTool(
      'extension_tool_remove_host_access_request',
      {
        description: 'Remove a host access request',
        inputSchema: {
          tabId: z
            .number()
            .optional()
            .describe('The id of the tab where host access request will be removed'),
          documentId: z
            .string()
            .optional()
            .describe('The id of a document where host access request will be removed'),
          pattern: z
            .string()
            .optional()
            .describe('The URL pattern where host access request will be removed'),
        },
      },
      async ({ tabId, documentId, pattern }) => {
        try {
          // Validate that either tabId or documentId is provided
          if (tabId === undefined && documentId === undefined) {
            return this.formatError(
              'Either tabId or documentId must be specified to remove host access request'
            );
          }

          // Build request object
          const request: any = {};

          if (tabId !== undefined) {
            request.tabId = tabId;
          }

          if (documentId !== undefined) {
            request.documentId = documentId;
          }

          if (pattern !== undefined) {
            request.pattern = pattern;
          }

          // Remove the host access request
          await new Promise<void>((resolve, reject) => {
            chrome.permissions.removeHostAccessRequest(request, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Host access request removed successfully', {
            tabId,
            documentId,
            pattern,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
