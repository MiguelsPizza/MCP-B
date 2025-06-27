import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface UserScriptsApiToolsOptions {
  register?: boolean;
  getScripts?: boolean;
  update?: boolean;
  unregister?: boolean;
  configureWorld?: boolean;
  getWorldConfigurations?: boolean;
  resetWorldConfiguration?: boolean;
  execute?: boolean;
}

export class UserScriptsApiTools extends BaseApiTools {
  protected apiName = 'UserScripts';

  constructor(server: McpServer, options: UserScriptsApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.userScripts) {
        return {
          available: false,
          message: 'chrome.userScripts API is not defined',
          details:
            'This extension needs the "userScripts" permission in its manifest.json and users must enable the appropriate toggle (Developer mode for Chrome <138 or Allow User Scripts for Chrome 138+)',
        };
      }

      // Test a basic method
      if (typeof chrome.userScripts.getScripts !== 'function') {
        return {
          available: false,
          message: 'chrome.userScripts.getScripts is not available',
          details:
            'The userScripts API appears to be partially available. Check manifest permissions and user toggle settings.',
        };
      }

      // Try to actually use the API
      chrome.userScripts.getScripts({} as chrome.userScripts.UserScriptFilter, () => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'UserScripts API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.userScripts API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('register')) {
      this.registerRegister();
    }

    if (this.shouldRegisterTool('getScripts')) {
      this.registerGetScripts();
    }

    if (this.shouldRegisterTool('update')) {
      this.registerUpdate();
    }

    if (this.shouldRegisterTool('unregister')) {
      this.registerUnregister();
    }

    if (this.shouldRegisterTool('configureWorld')) {
      this.registerConfigureWorld();
    }

    if (this.shouldRegisterTool('getWorldConfigurations')) {
      this.registerGetWorldConfigurations();
    }

    if (this.shouldRegisterTool('resetWorldConfiguration')) {
      this.registerResetWorldConfiguration();
    }

    if (this.shouldRegisterTool('execute')) {
      this.registerExecute();
    }
  }

  private registerRegister(): void {
    this.server.registerTool(
      'extension_tool_register_user_scripts',
      {
        description: 'Register one or more user scripts for this extension',
        inputSchema: {
          scripts: z
            .array(
              z.object({
                id: z
                  .string()
                  .describe('The ID of the user script. Must not start with underscore'),
                matches: z
                  .array(z.string())
                  .describe('Match patterns for pages this script will be injected into'),
                js: z
                  .array(
                    z.object({
                      code: z.string().optional().describe('JavaScript code to inject'),
                      file: z
                        .string()
                        .optional()
                        .describe('Path to JavaScript file relative to extension root'),
                    })
                  )
                  .optional()
                  .describe('List of script sources to inject'),
                allFrames: z
                  .boolean()
                  .optional()
                  .describe('Whether to inject into all frames (default: false)'),
                excludeMatches: z
                  .array(z.string())
                  .optional()
                  .describe('Pages to exclude from injection'),
                includeGlobs: z
                  .array(z.string())
                  .optional()
                  .describe('Wildcard patterns for pages to include'),
                excludeGlobs: z
                  .array(z.string())
                  .optional()
                  .describe('Wildcard patterns for pages to exclude'),
                runAt: z
                  .enum(['document_start', 'document_end', 'document_idle'])
                  .optional()
                  .describe('When to inject the script (default: document_idle)'),
                world: z
                  .enum(['MAIN', 'USER_SCRIPT'])
                  .optional()
                  .describe('JavaScript execution environment (default: USER_SCRIPT)'),
                worldId: z.string().optional().describe('User script world ID to execute in'),
              })
            )
            .describe('Array of user scripts to register'),
        },
      },
      async ({ scripts }) => {
        try {
          // Validate script objects
          for (const script of scripts) {
            if (script.id.startsWith('_')) {
              return this.formatError('Script ID cannot start with underscore: ' + script.id);
            }

            if (script.js) {
              for (const jsSource of script.js) {
                const hasCode = jsSource.code !== undefined;
                const hasFile = jsSource.file !== undefined;
                if (hasCode === hasFile) {
                  return this.formatError(
                    'Exactly one of code or file must be specified for each script source'
                  );
                }
              }
            }
          }

          await new Promise<void>((resolve, reject) => {
            chrome.userScripts.register(
              scripts as chrome.userScripts.RegisteredUserScript[],
              () => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve();
                }
              }
            );
          });

          return this.formatSuccess('User scripts registered successfully', {
            registeredCount: scripts.length,
            scriptIds: scripts.map((script) => script.id),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetScripts(): void {
    this.server.registerTool(
      'extension_tool_get_user_scripts',
      {
        description: 'Get all dynamically-registered user scripts for this extension',
        inputSchema: {
          ids: z
            .array(z.string())
            .optional()
            .describe('Filter to only return scripts with these IDs'),
        },
      },
      async ({ ids }) => {
        try {
          const filter: chrome.userScripts.UserScriptFilter = {};
          if (ids !== undefined) {
            filter.ids = ids;
          }

          const scripts = await new Promise<chrome.userScripts.RegisteredUserScript[]>(
            (resolve, reject) => {
              chrome.userScripts.getScripts(filter, (scripts) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(scripts);
                }
              });
            }
          );

          return this.formatJson({
            count: scripts.length,
            scripts: scripts.map((script) => ({
              id: script.id,
              matches: script.matches,
              allFrames: script.allFrames,
              excludeMatches: script.excludeMatches,
              includeGlobs: script.includeGlobs,
              excludeGlobs: script.excludeGlobs,
              runAt: script.runAt,
              world: script.world,
              worldId: script.worldId,
              jsSourcesCount: script.js?.length || 0,
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerUpdate(): void {
    this.server.registerTool(
      'extension_tool_update_user_scripts',
      {
        description: 'Update one or more user scripts for this extension',
        inputSchema: {
          scripts: z
            .array(
              z.object({
                id: z.string().describe('The ID of the user script to update'),
                matches: z
                  .array(z.string())
                  .optional()
                  .describe('Match patterns for pages this script will be injected into'),
                js: z
                  .array(
                    z.object({
                      code: z.string().optional().describe('JavaScript code to inject'),
                      file: z
                        .string()
                        .optional()
                        .describe('Path to JavaScript file relative to extension root'),
                    })
                  )
                  .optional()
                  .describe('List of script sources to inject'),
                allFrames: z.boolean().optional().describe('Whether to inject into all frames'),
                excludeMatches: z
                  .array(z.string())
                  .optional()
                  .describe('Pages to exclude from injection'),
                includeGlobs: z
                  .array(z.string())
                  .optional()
                  .describe('Wildcard patterns for pages to include'),
                excludeGlobs: z
                  .array(z.string())
                  .optional()
                  .describe('Wildcard patterns for pages to exclude'),
                runAt: z
                  .enum(['document_start', 'document_end', 'document_idle'])
                  .optional()
                  .describe('When to inject the script'),
                world: z
                  .enum(['MAIN', 'USER_SCRIPT'])
                  .optional()
                  .describe('JavaScript execution environment'),
                worldId: z.string().optional().describe('User script world ID to execute in'),
              })
            )
            .describe('Array of user scripts to update'),
        },
      },
      async ({ scripts }) => {
        try {
          // Validate script objects
          for (const script of scripts) {
            if (script.js) {
              for (const jsSource of script.js) {
                const hasCode = jsSource.code !== undefined;
                const hasFile = jsSource.file !== undefined;
                if (hasCode === hasFile) {
                  return this.formatError(
                    'Exactly one of code or file must be specified for each script source'
                  );
                }
              }
            }
          }

          await new Promise<void>((resolve, reject) => {
            chrome.userScripts.update(scripts as chrome.userScripts.RegisteredUserScript[], () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('User scripts updated successfully', {
            updatedCount: scripts.length,
            scriptIds: scripts.map((script) => script.id),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerUnregister(): void {
    this.server.registerTool(
      'extension_tool_unregister_user_scripts',
      {
        description: 'Unregister dynamically-registered user scripts for this extension',
        inputSchema: {
          ids: z
            .array(z.string())
            .optional()
            .describe(
              'Filter to only unregister scripts with these IDs. If not specified, all scripts are unregistered'
            ),
        },
      },
      async ({ ids }) => {
        try {
          const filter: chrome.userScripts.UserScriptFilter = {};
          if (ids !== undefined) {
            filter.ids = ids;
          }

          // Get scripts before unregistering to know what we're removing
          const scriptsBefore = await new Promise<chrome.userScripts.RegisteredUserScript[]>(
            (resolve, reject) => {
              chrome.userScripts.getScripts(filter, (scripts) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(scripts);
                }
              });
            }
          );

          await new Promise<void>((resolve, reject) => {
            chrome.userScripts.unregister(filter, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('User scripts unregistered successfully', {
            unregisteredCount: scriptsBefore.length,
            unregisteredScriptIds: scriptsBefore.map((script) => script.id),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerConfigureWorld(): void {
    this.server.registerTool(
      'extension_tool_configure_user_script_world',
      {
        description: 'Configure the USER_SCRIPT execution environment',
        inputSchema: {
          csp: z.string().optional().describe('Content Security Policy for the world'),
          messaging: z
            .boolean()
            .optional()
            .describe('Whether messaging APIs are exposed (default: false)'),
          worldId: z.string().optional().describe('ID of the specific user script world to update'),
        },
      },
      async ({ csp, messaging, worldId }) => {
        try {
          const properties: chrome.userScripts.WorldProperties = {};
          if (csp !== undefined) properties.csp = csp;
          if (messaging !== undefined) properties.messaging = messaging;
          if (worldId !== undefined) properties.worldId = worldId;

          await new Promise<void>((resolve, reject) => {
            chrome.userScripts.configureWorld(properties, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('User script world configured successfully', {
            worldId: worldId || 'default',
            csp: csp,
            messaging: messaging,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetWorldConfigurations(): void {
    this.server.registerTool(
      'extension_tool_get_world_configurations',
      {
        description: 'Retrieve all registered world configurations',
        inputSchema: {},
      },
      async () => {
        try {
          const worlds = await new Promise<chrome.userScripts.WorldProperties[]>(
            (resolve, reject) => {
              chrome.userScripts.getWorldConfigurations((worlds) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(worlds);
                }
              });
            }
          );

          return this.formatJson({
            count: worlds.length,
            worlds: worlds.map((world) => ({
              worldId: world.worldId,
              csp: world.csp,
              messaging: world.messaging,
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerResetWorldConfiguration(): void {
    this.server.registerTool(
      'extension_tool_reset_world_configuration',
      {
        description: 'Reset the configuration for a user script world to defaults',
        inputSchema: {
          worldId: z
            .string()
            .optional()
            .describe('ID of the user script world to reset. If omitted, resets the default world'),
        },
      },
      async ({ worldId = 'default' }) => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.userScripts.resetWorldConfiguration(worldId, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('World configuration reset successfully', {
            worldId: worldId || 'default',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerExecute(): void {
    this.server.registerTool(
      'extension_tool_execute_user_script',
      {
        description: 'Inject a script into a target context',
        inputSchema: {
          target: z
            .object({
              tabId: z.number().describe('The ID of the tab to inject into'),
              frameIds: z
                .array(z.number())
                .optional()
                .describe('IDs of specific frames to inject into'),
              documentIds: z
                .array(z.string())
                .optional()
                .describe('IDs of specific documents to inject into'),
              allFrames: z
                .boolean()
                .optional()
                .describe('Whether to inject into all frames (default: false)'),
            })
            .describe('Target specification for injection'),
          js: z
            .array(
              z.object({
                code: z.string().optional().describe('JavaScript code to inject'),
                file: z
                  .string()
                  .optional()
                  .describe('Path to JavaScript file relative to extension root'),
              })
            )
            .describe('List of script sources to inject'),
          world: z
            .enum(['MAIN', 'USER_SCRIPT'])
            .optional()
            .describe('JavaScript execution environment (default: USER_SCRIPT)'),
          worldId: z.string().optional().describe('User script world ID to execute in'),
          injectImmediately: z
            .boolean()
            .optional()
            .describe('Whether to inject immediately without waiting (default: false)'),
        },
      },
      async ({ target, js, world, worldId, injectImmediately }) => {
        try {
          // Validate script sources
          for (const jsSource of js) {
            const hasCode = jsSource.code !== undefined;
            const hasFile = jsSource.file !== undefined;
            if (hasCode === hasFile) {
              return this.formatError(
                'Exactly one of code or file must be specified for each script source'
              );
            }
          }

          const injection: chrome.userScripts.UserScriptInjection = {
            target: target as chrome.userScripts.InjectionTarget,
            js: js as chrome.userScripts.ScriptSource[],
          };

          if (world !== undefined) injection.world = world;
          if (worldId !== undefined) injection.worldId = worldId;
          if (injectImmediately !== undefined) injection.injectImmediately = injectImmediately;

          const results = await new Promise<chrome.userScripts.InjectionResult[]>(
            (resolve, reject) => {
              chrome.userScripts.execute(injection, (results) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(results);
                }
              });
            }
          );

          return this.formatJson({
            injectionCount: results.length,
            results: results.map((result) => ({
              frameId: result.frameId,
              documentId: result.documentId,
              error: result.error,
              hasResult: result.result !== undefined,
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
