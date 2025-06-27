import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface DevtoolsInspectedWindowApiToolsOptions {
  eval?: boolean;
  reload?: boolean;
  getResources?: boolean;
}

export class DevtoolsInspectedWindowApiTools extends BaseApiTools {
  protected apiName = 'Devtools.inspectedWindow';

  constructor(server: McpServer, options: DevtoolsInspectedWindowApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.devtools || !chrome.devtools.inspectedWindow) {
        return {
          available: false,
          message: 'chrome.devtools.inspectedWindow API is not defined',
          details:
            'This extension needs to be running in a devtools context and have the "devtools" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.devtools.inspectedWindow.eval !== 'function') {
        return {
          available: false,
          message: 'chrome.devtools.inspectedWindow.eval is not available',
          details:
            'The devtools.inspectedWindow API appears to be partially available. Check manifest permissions and devtools context.',
        };
      }

      return {
        available: true,
        message: 'Devtools.inspectedWindow API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.devtools.inspectedWindow API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('eval')) {
      this.registerEval();
    }

    if (this.shouldRegisterTool('reload')) {
      this.registerReload();
    }

    if (this.shouldRegisterTool('getResources')) {
      this.registerGetResources();
    }
  }

  private registerEval(): void {
    this.server.registerTool(
      'extension_tool_eval_inspected_window',
      {
        description: 'Evaluate JavaScript expression in the context of the inspected page',
        inputSchema: {
          expression: z
            .string()
            .describe('JavaScript expression to evaluate in the inspected page'),
          options: z
            .object({
              frameURL: z
                .string()
                .optional()
                .describe(
                  'URL of the frame to evaluate in. If omitted, evaluates in the main frame'
                ),
              contextSecurityOrigin: z
                .string()
                .optional()
                .describe('Security origin for the evaluation context'),
              useContentScriptContext: z
                .boolean()
                .optional()
                .describe('If true, evaluate in the context of a content script'),
            })
            .optional()
            .describe('Options for the evaluation'),
        },
      },
      async ({ expression, options }) => {
        try {
          const result = await new Promise<
            [any, chrome.devtools.inspectedWindow.EvaluationExceptionInfo?]
          >((resolve, reject) => {
            const evalOptions: chrome.devtools.inspectedWindow.EvalOptions = {};

            if (options?.frameURL !== undefined) {
              evalOptions.frameURL = options.frameURL;
            }
            if (options?.contextSecurityOrigin !== undefined) {
              evalOptions.contextSecurityOrigin = options.contextSecurityOrigin;
            }
            if (options?.useContentScriptContext !== undefined) {
              evalOptions.useContentScriptContext = options.useContentScriptContext;
            }

            chrome.devtools.inspectedWindow.eval(
              expression,
              Object.keys(evalOptions).length > 0 ? evalOptions : undefined,
              (result, exceptionInfo) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve([result, exceptionInfo]);
                }
              }
            );
          });

          const [evalResult, exceptionInfo] = result;

          if (exceptionInfo) {
            return this.formatJson({
              success: false,
              expression,
              exception: {
                isError: exceptionInfo.isError,
                code: exceptionInfo.code,
                description: exceptionInfo.description,
                details: exceptionInfo.details,
                isException: exceptionInfo.isException,
                value: exceptionInfo.value,
              },
            });
          }

          return this.formatJson({
            success: true,
            expression,
            result: evalResult,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerReload(): void {
    this.server.registerTool(
      'extension_tool_reload_inspected_window',
      {
        description: 'Reload the inspected page',
        inputSchema: {
          reloadOptions: z
            .object({
              ignoreCache: z.boolean().optional().describe('If true, reload ignoring cache'),
              userAgent: z
                .string()
                .optional()
                .describe('Custom user agent string to use for the reload'),
              injectedScript: z
                .string()
                .optional()
                .describe(
                  'Script to inject into every frame of the inspected page immediately upon load'
                ),
            })
            .optional()
            .describe('Options for the reload'),
        },
      },
      async ({ reloadOptions }) => {
        try {
          const options: chrome.devtools.inspectedWindow.ReloadOptions = {};

          if (reloadOptions?.ignoreCache !== undefined) {
            options.ignoreCache = reloadOptions.ignoreCache;
          }
          if (reloadOptions?.userAgent !== undefined) {
            options.userAgent = reloadOptions.userAgent;
          }
          if (reloadOptions?.injectedScript !== undefined) {
            options.injectedScript = reloadOptions.injectedScript;
          }

          chrome.devtools.inspectedWindow.reload(
            Object.keys(options).length > 0 ? options : undefined
          );

          return this.formatSuccess('Inspected window reload initiated', {
            options: reloadOptions || {},
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetResources(): void {
    this.server.registerTool(
      'extension_tool_get_inspected_window_resources',
      {
        description: 'Get all resources loaded by the inspected page',
        inputSchema: {},
      },
      async () => {
        try {
          const resources = await new Promise<chrome.devtools.inspectedWindow.Resource[]>(
            (resolve, reject) => {
              chrome.devtools.inspectedWindow.getResources((resources) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(resources);
                }
              });
            }
          );

          return this.formatJson({
            count: resources.length,
            resources: resources.map((resource) => ({
              url: resource.url,
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
