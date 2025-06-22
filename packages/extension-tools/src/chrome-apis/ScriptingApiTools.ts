import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface ScriptingApiToolsOptions {
  executeScript?: boolean;
  executeUserScript?: boolean;
  insertCSS?: boolean;
  removeCSS?: boolean;
}

export class ScriptingApiTools extends BaseApiTools {
  protected apiName = 'Scripting';

  constructor(server: McpServer, options: ScriptingApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    // Check chrome.scripting availability
    try {
      if (!chrome.scripting) {
        return {
          available: false,
          message: 'chrome.scripting API is not defined',
          details:
            'This extension needs the "scripting" permission in its manifest.json. This API is available in Chrome 88+.',
        };
      }

      if (typeof chrome.scripting.executeScript !== 'function') {
        return {
          available: false,
          message: 'chrome.scripting.executeScript is not available',
          details:
            'The scripting API appears to be partially available. Ensure you have Chrome 88+ and the "scripting" permission.',
        };
      }

      return {
        available: true,
        message: 'Scripting API is available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.scripting API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    // Always register the standard scripting tool
    if (this.shouldRegisterTool('executeScript')) {
      this.registerExecuteScript();
    }

    // Check and register UserScripts API if available
    if (this.shouldRegisterTool('executeUserScript')) {
      this.checkAndRegisterUserScripts();
    }

    // CSS tools
    if (this.shouldRegisterTool('insertCSS')) {
      this.registerInsertCSS();
    }

    if (this.shouldRegisterTool('removeCSS')) {
      this.registerRemoveCSS();
    }
  }

  private checkAndRegisterUserScripts(): void {
    // Check if userScripts API is available
    if (!chrome.userScripts) {
      console.warn('  ✗ UserScripts API not available - Chrome 120+ required');
      return;
    }

    try {
      // Method call which throws if API permission or toggle is not enabled
      chrome.userScripts.getScripts();

      // Check Chrome version for execute method support
      const chromeVersion = this.getChromeVersion();
      if (chromeVersion >= 135) {
        console.log('  ✓ UserScripts execute() method available (Chrome 135+)');
        this.registerUserScriptExecute();
      } else {
        console.log('  ✓ UserScripts API available (legacy mode)');
        this.registerUserScriptLegacy();
      }
    } catch (error) {
      console.warn(
        '  ✗ UserScripts API not enabled. Users need to enable developer mode and "User Scripts" toggle in chrome://extensions'
      );
    }
  }

  private getChromeVersion(): number {
    const match = navigator.userAgent.match(/(Chrome|Chromium)\/([0-9]+)/);
    return match ? Number(match[2]) : 0;
  }

  private registerExecuteScript(): void {
    this.server.registerTool(
      'execute_script',
      {
        description:
          'Execute JavaScript code in a specific tab using chrome.scripting API. Limited by CSP restrictions. If no tabId is specified, operates on the currently active tab',
        inputSchema: {
          tabId: z
            .number()
            .optional()
            .describe('Tab ID to execute script in (defaults to active tab)'),
          code: z.string().describe('JavaScript code to execute'),
          allFrames: z.boolean().optional().describe('Execute in all frames (default: false)'),
          world: z
            .enum(['MAIN', 'ISOLATED'])
            .optional()
            .default('MAIN')
            .describe(
              'Execution world - MAIN runs in page context, ISOLATED runs in extension context'
            ),
        },
      },
      async ({ tabId, code, allFrames = false, world = 'MAIN' }) => {
        try {
          if (tabId === undefined) {
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!activeTab || !activeTab.id) {
              return this.formatError(new Error('No active tab found'));
            }
            tabId = activeTab.id;
          }

          const injectionFunction = (codeToExecute: string) => {
            try {
              // For MAIN world, we need to inject via script tag to bypass some CSP restrictions
              const script = document.createElement('script');
              script.textContent = `
                (function() {
                  try {
                    const __result = (function() { ${codeToExecute} })();
                    window.__extensionScriptResult = { success: true, result: __result };
                  } catch (error) {
                    window.__extensionScriptResult = { 
                      success: false, 
                      error: error.message || String(error) 
                    };
                  }
                })();
              `;
              document.documentElement.appendChild(script);
              script.remove();

              const result = (window as any).__extensionScriptResult;
              delete (window as any).__extensionScriptResult;
              return result || { success: false, error: 'No result returned' };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
              };
            }
          };

          const results = await chrome.scripting.executeScript({
            target: { tabId, allFrames },
            func: injectionFunction,
            args: [code],
            world: world as chrome.scripting.ExecutionWorld,
          });

          return this.formatJson(results);
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerUserScriptExecute(): void {
    this.server.registerTool(
      'execute_user_script',
      {
        description:
          'Execute JavaScript using User Scripts API with no CSP restrictions (Chrome 135+). Requires user to enable developer mode. If no tabId is specified, operates on the currently active tab',
        inputSchema: {
          tabId: z
            .number()
            .optional()
            .describe('Tab ID to execute script in (defaults to active tab)'),
          code: z.string().describe('JavaScript code to execute'),
          allFrames: z.boolean().optional().describe('Execute in all frames (default: false)'),
          world: z
            .enum(['USER_SCRIPT', 'MAIN'])
            .optional()
            .default('USER_SCRIPT')
            .describe('Execution world (default: USER_SCRIPT for no CSP restrictions)'),
        },
      },
      async ({ tabId, code, allFrames = false, world = 'USER_SCRIPT' }) => {
        try {
          if (tabId === undefined) {
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!activeTab || !activeTab.id) {
              return this.formatError(new Error('No active tab found'));
            }
            tabId = activeTab.id;
          }

          // Configure world for messaging if needed
          chrome.userScripts.configureWorld({
            messaging: true,
            csp: "script-src 'self' 'unsafe-eval'; object-src 'self';",
          });

          const results = await chrome.userScripts.execute({
            target: { tabId, allFrames },
            world: world as chrome.userScripts.ExecutionWorld,
            js: [{ code }],
            injectImmediately: true,
          });

          return this.formatJson(results);
        } catch (error) {
          if (error instanceof Error && error.message.includes('User Scripts')) {
            return this.formatError(
              new Error(
                'User Scripts API is not enabled. Enable developer mode and the "User Scripts" toggle in chrome://extensions/?id=' +
                  chrome.runtime.id
              )
            );
          }
          return this.formatError(error);
        }
      }
    );
  }

  private registerUserScriptLegacy(): void {
    this.server.registerTool(
      'execute_user_script_legacy',
      {
        description:
          'Execute JavaScript using User Scripts API (legacy method for Chrome < 135). No CSP restrictions. If no tabId is specified, operates on the currently active tab',
        inputSchema: {
          tabId: z
            .number()
            .optional()
            .describe('Tab ID to execute script in (defaults to active tab)'),
          code: z.string().describe('JavaScript code to execute'),
          allFrames: z.boolean().optional().describe('Execute in all frames (default: false)'),
        },
      },
      async ({ tabId, code, allFrames = false }) => {
        try {
          if (tabId === undefined) {
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!activeTab || !activeTab.id) {
              return this.formatError(new Error('No active tab found'));
            }
            tabId = activeTab.id;
          }

          const tab = await chrome.tabs.get(tabId);
          if (!tab.url) {
            return this.formatError(new Error('Tab URL not available'));
          }

          const scriptId = `temp_${Date.now()}`;

          // Configure messaging
          await chrome.userScripts.configureWorld({ messaging: true });

          // Set up result listener
          const resultPromise = new Promise((resolve) => {
            const listener = (message: any, _sender: any) => {
              if (message.type === 'SCRIPT_RESULT' && message.scriptId === scriptId) {
                chrome.runtime.onUserScriptMessage.removeListener(listener);
                resolve(message);
              }
            };
            chrome.runtime.onUserScriptMessage.addListener(listener);
          });

          // Register script
          await chrome.userScripts.register([
            {
              id: scriptId,
              matches: [new URL(tab.url).origin + '/*'],
              js: [
                {
                  code: `
                (async () => {
                  try {
                    const result = await (async () => { ${code} })();
                    chrome.runtime.sendMessage({
                      type: 'SCRIPT_RESULT',
                      scriptId: '${scriptId}',
                      success: true,
                      result
                    });
                  } catch (error) {
                    chrome.runtime.sendMessage({
                      type: 'SCRIPT_RESULT',
                      scriptId: '${scriptId}',
                      success: false,
                      error: error.message
                    });
                  }
                })();
              `,
                },
              ],
              runAt: 'document_idle',
              world: 'USER_SCRIPT',
              allFrames,
            },
          ]);

          // Reload tab to trigger script
          await chrome.tabs.reload(tabId);

          // Wait for result
          const result = await Promise.race([
            resultPromise,
            new Promise((r) => setTimeout(() => r({ timeout: true }), 5000)),
          ]);

          // Cleanup
          await chrome.userScripts.unregister({ ids: [scriptId] });

          if ((result as any).timeout) {
            return this.formatError(new Error('Script execution timed out'));
          }

          return this.formatJson(result);
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerInsertCSS(): void {
    this.server.registerTool(
      'insert_css',
      {
        description:
          'Insert CSS into a tab. If no tabId is specified, operates on the currently active tab',
        inputSchema: {
          tabId: z
            .number()
            .optional()
            .describe('Tab ID to insert CSS into (defaults to active tab)'),
          css: z.string().describe('CSS code to inject'),
          allFrames: z.boolean().optional().describe('Inject in all frames (default: false)'),
        },
      },
      async ({ tabId, css, allFrames = false }) => {
        try {
          if (tabId === undefined) {
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!activeTab || !activeTab.id) {
              return this.formatError(new Error('No active tab found'));
            }
            tabId = activeTab.id;
          }

          await chrome.scripting.insertCSS({
            target: { tabId, allFrames },
            css,
          });

          return this.formatSuccess(`CSS injected into tab ${tabId}`);
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerRemoveCSS(): void {
    if (typeof chrome.scripting.removeCSS !== 'function') {
      console.warn('  ✗ removeCSS not available - Chrome 90+ required');
      return;
    }

    this.server.registerTool(
      'remove_css',
      {
        description:
          'Remove previously injected CSS from a tab. If no tabId is specified, operates on the currently active tab',
        inputSchema: {
          tabId: z
            .number()
            .optional()
            .describe('Tab ID to remove CSS from (defaults to active tab)'),
          css: z.string().describe('CSS code to remove (must match exactly)'),
          allFrames: z.boolean().optional().describe('Remove from all frames (default: false)'),
        },
      },
      async ({ tabId, css, allFrames = false }) => {
        try {
          if (tabId === undefined) {
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!activeTab || !activeTab.id) {
              return this.formatError(new Error('No active tab found'));
            }
            tabId = activeTab.id;
          }

          await chrome.scripting.removeCSS({
            target: { tabId, allFrames },
            css,
          });

          return this.formatSuccess(`CSS removed from tab ${tabId}`);
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
