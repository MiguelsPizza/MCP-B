import { type ApiAvailability, BaseApiTools } from '@mcp-b/extension-tools';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export interface UserScriptToolsOptions {
  registerScript?: boolean;
  unregisterScript?: boolean;
  updateScript?: boolean;
  getAllScripts?: boolean;
  getRegisteredScripts?: boolean;
  testExecuteScript?: boolean;
  configureWorld?: boolean;
  resetWorldConfiguration?: boolean;
}

export class UserScriptTools extends BaseApiTools {
  protected apiName = 'UserScripts';

  constructor(server: McpServer, options: UserScriptToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if chrome.userScripts API is available
      if (typeof chrome === 'undefined' || !chrome.userScripts) {
        return {
          available: false,
          message: 'Chrome userScripts API is not available',
          details: 'This API requires Chrome 120+ with the userScripts permission',
        };
      }

      // Check for specific API methods
      const hasRegister = typeof chrome.userScripts.register === 'function';
      const hasExecute = typeof chrome.userScripts.execute === 'function';

      if (!hasRegister) {
        return {
          available: false,
          message: 'Chrome userScripts.register is not available',
          details: 'This API requires Chrome 120+ with proper permissions',
        };
      }

      return {
        available: true,
        message: 'Chrome userScripts API is fully available',
        details: hasExecute ? 'Including execute() for Chrome 135+' : 'Register/unregister only (Chrome 120+)',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access Chrome userScripts API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('registerScript')) {
      this.registerRegisterScript();
    }

    if (this.shouldRegisterTool('unregisterScript')) {
      this.registerUnregisterScript();
    }

    if (this.shouldRegisterTool('updateScript')) {
      this.registerUpdateScript();
    }

    if (this.shouldRegisterTool('getAllScripts')) {
      this.registerGetAllScripts();
    }

    if (this.shouldRegisterTool('getRegisteredScripts')) {
      this.registerGetRegisteredScripts();
    }

    if (this.shouldRegisterTool('testExecuteScript')) {
      this.registerTestExecuteScript();
    }

    if (this.shouldRegisterTool('configureWorld')) {
      this.registerConfigureWorld();
    }

    if (this.shouldRegisterTool('resetWorldConfiguration')) {
      this.registerResetWorldConfiguration();
    }
  }

  private registerRegisterScript(): void {
    this.server.registerTool(
      'extension_tool_userscripts_register',
      {
        description: 'Register a new userscript with Chrome userScripts API',
        inputSchema: {
          id: z.string().describe('Unique identifier for the script'),
          matches: z.array(z.string()).describe('URL match patterns where script runs'),
          excludeMatches: z.array(z.string()).optional().describe('URL patterns to exclude'),
          allFrames: z.boolean().optional().describe('Run in all frames (default: false)'),
          js: z.array(z.object({
            code: z.string().optional().describe('JavaScript code to inject'),
            file: z.string().optional().describe('Path to JavaScript file'),
          })).describe('JavaScript to inject (code or file)'),
          runAt: z.enum(['document_start', 'document_end', 'document_idle']).optional()
            .describe('When to inject the script'),
          world: z.enum(['MAIN', 'USER_SCRIPT']).optional()
            .describe('Execution world (default: USER_SCRIPT)'),
          worldId: z.string().optional()
            .describe('Unique ID for USER_SCRIPT world isolation'),
        },
      },
      async (params) => {
        try {
          const scriptConfig: chrome.userScripts.RegisteredUserScript = {
            id: params.id,
            matches: params.matches,
            excludeMatches: params.excludeMatches,
            allFrames: params.allFrames,
            js: params.js.map(item => {
              if (item.code) {
                return { code: item.code };
              } else if (item.file) {
                return { file: item.file };
              }
              throw new Error('Each js item must have either code or file');
            }),
            runAt: params.runAt,
            world: params.world || 'USER_SCRIPT',
          };

          if (params.world === 'USER_SCRIPT' && params.worldId) {
            scriptConfig.worldId = params.worldId;
          }

          await chrome.userScripts.register([scriptConfig]);

          // Save the script code to chrome.storage for persistence
          if (params.js.length > 0 && params.js[0].code) {
            const storageKey = `webmcp:userscripts:${params.id}`;
            await chrome.storage.local.set({ [storageKey]: params.js[0].code });
          }

          return this.formatSuccess('UserScript registered successfully', {
            id: params.id,
            matches: params.matches.length,
            world: params.world || 'USER_SCRIPT',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerUnregisterScript(): void {
    this.server.registerTool(
      'extension_tool_userscripts_unregister',
      {
        description: 'Unregister userscripts by ID or filter',
        inputSchema: {
          ids: z.array(z.string()).optional()
            .describe('Script IDs to unregister'),
          filter: z.object({
            ids: z.array(z.string()).optional(),
          }).optional().describe('Filter for scripts to unregister'),
        },
      },
      async (params) => {
        try {
          if (params.ids && params.ids.length > 0) {
            await chrome.userScripts.unregister({ ids: params.ids });
            
            // Clean up stored code from chrome.storage
            const storageKeys = params.ids.map((id: string) => `webmcp:userscripts:${id}`);
            await chrome.storage.local.remove(storageKeys);
            
            return this.formatSuccess('UserScripts unregistered successfully', {
              unregistered: params.ids,
            });
          } else if (params.filter) {
            await chrome.userScripts.unregister(params.filter);
            
            // If filter has specific IDs, clean those up
            if (params.filter.ids) {
              const storageKeys = params.filter.ids.map((id: string) => `webmcp:userscripts:${id}`);
              await chrome.storage.local.remove(storageKeys);
            }
            
            return this.formatSuccess('UserScripts unregistered by filter', {
              filter: params.filter,
            });
          } else {
            // Unregister all scripts
            await chrome.userScripts.unregister();
            
            // Clean up all userscript code from storage
            const allStorage = await chrome.storage.local.get();
            const userscriptKeys = Object.keys(allStorage).filter(key => 
              key.startsWith('webmcp:userscripts:')
            );
            if (userscriptKeys.length > 0) {
              await chrome.storage.local.remove(userscriptKeys);
            }
            
            return this.formatSuccess('All userscripts unregistered');
          }
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerUpdateScript(): void {
    this.server.registerTool(
      'extension_tool_userscripts_update',
      {
        description: 'Update existing userscripts',
        inputSchema: {
          scripts: z.array(z.object({
            id: z.string().describe('Script ID to update'),
            matches: z.array(z.string()).optional(),
            excludeMatches: z.array(z.string()).optional(),
            allFrames: z.boolean().optional(),
            js: z.array(z.object({
              code: z.string().optional(),
              file: z.string().optional(),
            })).optional(),
            runAt: z.enum(['document_start', 'document_end', 'document_idle']).optional(),
            world: z.enum(['MAIN', 'USER_SCRIPT']).optional(),
            worldId: z.string().optional(),
          })).describe('Scripts to update'),
        },
      },
      async ({ scripts }) => {
        try {
          const updateConfigs = scripts.map((script: any) => {
            const config: chrome.userScripts.RegisteredUserScript = {
              id: script.id,
              js: [],
              matches: []
            };

            if (script.matches) config.matches = script.matches;
            if (script.excludeMatches) config.excludeMatches = script.excludeMatches;
            if (script.allFrames !== undefined) config.allFrames = script.allFrames;
            if (script.js) {
              config.js = script.js.map((item: any) => {
                if (item.code) return { code: item.code };
                if (item.file) return { file: item.file };
                throw new Error('Each js item must have either code or file');
              });
            }
            if (script.runAt) config.runAt = script.runAt;
            if (script.world) config.world = script.world;
            if (script.world === 'USER_SCRIPT' && script.worldId) {
              config.worldId = script.worldId;
            }

            return config;
          });

          await chrome.userScripts.update(updateConfigs);

          return this.formatSuccess('UserScripts updated successfully', {
            updated: scripts.map((s: any) => s.id),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetAllScripts(): void {
    this.server.registerTool(
      'extension_tool_userscripts_get_all',
      {
        description: 'Get all registered userscripts',
        inputSchema: {},
      },
      async () => {
        try {
          const scripts = await chrome.userScripts.getScripts();

          return this.formatJson({
            count: scripts.length,
            scripts: scripts.map(script => ({
              id: script.id,
              matches: script.matches,
              excludeMatches: script.excludeMatches,
              allFrames: script.allFrames,
              runAt: script.runAt,
              world: script.world,
              worldId: script.worldId,
              jsCount: script.js?.length || 0,
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetRegisteredScripts(): void {
    this.server.registerTool(
      'extension_tool_userscripts_get_registered',
      {
        description: 'Get specific registered userscripts by filter',
        inputSchema: {
          ids: z.array(z.string()).optional()
            .describe('Get scripts with these IDs'),
        },
      },
      async ({ ids }) => {
        try {
          const filter = ids ? { ids } : undefined;
          const scripts = await chrome.userScripts.getScripts(filter);

          return this.formatJson({
            count: scripts.length,
            scripts: scripts.map(script => ({
              id: script.id,
              matches: script.matches,
              excludeMatches: script.excludeMatches,
              allFrames: script.allFrames,
              runAt: script.runAt,
              world: script.world,
              worldId: script.worldId,
              js: script.js?.map(item => ({
                hasCode: 'code' in item,
                hasFile: 'file' in item,
                codeLength: 'code' in item ? item.code?.length : undefined,
                file: 'file' in item ? item.file : undefined,
              })),
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerTestExecuteScript(): void {
    this.server.registerTool(
      'extension_tool_userscripts_test_execute',
      {
        description: 'Test execute a script without registering it (Chrome 135+)',
        inputSchema: {
          code: z.string().describe('JavaScript code to execute'),
          tabId: z.number().describe('Tab ID where to execute'),
          frameIds: z.array(z.number()).optional()
            .describe('Specific frame IDs to target'),
          allFrames: z.boolean().optional()
            .describe('Execute in all frames'),
          documentIds: z.array(z.string()).optional()
            .describe('Specific document IDs to target'),
          world: z.enum(['MAIN', 'USER_SCRIPT']).optional()
            .describe('Execution world (default: USER_SCRIPT)'),
          worldId: z.string().optional()
            .describe('Unique ID for USER_SCRIPT world isolation'),
          injectImmediately: z.boolean().optional()
            .describe('Inject immediately without waiting for document'),
        },
      },
      async (params) => {
        try {
          // Check if execute is available (Chrome 135+)
          if (typeof chrome.userScripts.execute !== 'function') {
            return this.formatError('chrome.userScripts.execute requires Chrome 135 or later');
          }

          const executeParams: any = {
            target: {
              tabId: params.tabId,
            },
            js: [{ code: params.code }],
            world: params.world || 'USER_SCRIPT',
            injectImmediately: params.injectImmediately,
          };

          if (params.frameIds) {
            executeParams.target.frameIds = params.frameIds;
          }
          if (params.allFrames !== undefined) {
            executeParams.target.allFrames = params.allFrames;
          }
          if (params.documentIds) {
            executeParams.target.documentIds = params.documentIds;
          }
          if (params.world === 'USER_SCRIPT' && params.worldId) {
            executeParams.worldId = params.worldId;
          }

          const results = await chrome.userScripts.execute(executeParams);

          return this.formatSuccess('Script executed successfully', {
            results: results.map(result => ({
              frameId: result.frameId,
              documentId: result.documentId,
              result: result.result,
              error: result.error,
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerConfigureWorld(): void {
    this.server.registerTool(
      'extension_tool_userscripts_configure_world',
      {
        description: 'Configure USER_SCRIPT world properties',
        inputSchema: {
          worldId: z.string().describe('World ID to configure'),
          csp: z.string().optional()
            .describe('Content Security Policy for the world'),
          messaging: z.boolean().optional()
            .describe('Enable messaging between worlds'),
        },
      },
      async ({ worldId, csp, messaging }) => {
        try {
          const properties: chrome.userScripts.WorldProperties = {};

          if (csp !== undefined) {
            properties.csp = csp;
          }
          if (messaging !== undefined) {
            properties.messaging = messaging;
          }

          await chrome.userScripts.configureWorld({
            worldId,
            ...properties,
          });

          return this.formatSuccess('World configured successfully', {
            worldId,
            configured: Object.keys(properties),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerResetWorldConfiguration(): void {
    this.server.registerTool(
      'extension_tool_userscripts_reset_world',
      {
        description: 'Reset USER_SCRIPT world configuration to defaults',
        inputSchema: {
          worldId: z.string().describe('World ID to reset'),
        },
      },
      async ({ worldId }) => {
        try {
          await chrome.userScripts.resetWorldConfiguration(worldId);

          return this.formatSuccess('World configuration reset successfully', {
            worldId,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
