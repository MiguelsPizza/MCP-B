import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface DebuggerApiToolsOptions {
  attach?: boolean;
  detach?: boolean;
  sendCommand?: boolean;
  getTargets?: boolean;
}

export class DebuggerApiTools extends BaseApiTools {
  protected apiName = 'Debugger';

  constructor(server: McpServer, options: DebuggerApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.debugger) {
        return {
          available: false,
          message: 'chrome.debugger API is not defined',
          details: 'This extension needs the "debugger" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.debugger.getTargets !== 'function') {
        return {
          available: false,
          message: 'chrome.debugger.getTargets is not available',
          details:
            'The debugger API appears to be partially available. Check manifest permissions.',
        };
      }

      // Try to actually use the API
      chrome.debugger.getTargets((_targets) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'Debugger API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.debugger API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('attach')) {
      this.registerAttach();
    }

    if (this.shouldRegisterTool('detach')) {
      this.registerDetach();
    }

    if (this.shouldRegisterTool('sendCommand')) {
      this.registerSendCommand();
    }

    if (this.shouldRegisterTool('getTargets')) {
      this.registerGetTargets();
    }
  }

  private registerAttach(): void {
    this.server.registerTool(
      'extension_tool_attach_debugger',
      {
        description: 'Attach debugger to a target (tab, extension, or target ID)',
        inputSchema: {
          tabId: z.number().optional().describe('The ID of the tab to debug'),
          extensionId: z.string().optional().describe('The ID of the extension to debug'),
          targetId: z.string().optional().describe('The opaque ID of the debug target'),
          requiredVersion: z
            .string()
            .default('1.3')
            .describe('Required debugging protocol version (default: 1.3)'),
        },
      },
      async ({ tabId, extensionId, targetId, requiredVersion }) => {
        try {
          // Validate that at least one target identifier is provided
          if (tabId === undefined && extensionId === undefined && targetId === undefined) {
            return this.formatError(
              'Either tabId, extensionId, or targetId must be specified to attach debugger'
            );
          }

          // Build debuggee object
          const debuggee: chrome.debugger.Debuggee = {};
          if (tabId !== undefined) debuggee.tabId = tabId;
          if (extensionId !== undefined) debuggee.extensionId = extensionId;
          if (targetId !== undefined) debuggee.targetId = targetId;

          // Attach debugger
          await new Promise<void>((resolve, reject) => {
            chrome.debugger.attach(debuggee, requiredVersion, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Debugger attached successfully', {
            target: debuggee,
            protocolVersion: requiredVersion,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerDetach(): void {
    this.server.registerTool(
      'extension_tool_detach_debugger',
      {
        description: 'Detach debugger from a target',
        inputSchema: {
          tabId: z.number().optional().describe('The ID of the tab to detach from'),
          extensionId: z.string().optional().describe('The ID of the extension to detach from'),
          targetId: z
            .string()
            .optional()
            .describe('The opaque ID of the debug target to detach from'),
        },
      },
      async ({ tabId, extensionId, targetId }) => {
        try {
          // Validate that at least one target identifier is provided
          if (tabId === undefined && extensionId === undefined && targetId === undefined) {
            return this.formatError(
              'Either tabId, extensionId, or targetId must be specified to detach debugger'
            );
          }

          // Build debuggee object
          const debuggee: chrome.debugger.Debuggee = {};
          if (tabId !== undefined) debuggee.tabId = tabId;
          if (extensionId !== undefined) debuggee.extensionId = extensionId;
          if (targetId !== undefined) debuggee.targetId = targetId;

          // Detach debugger
          await new Promise<void>((resolve, reject) => {
            chrome.debugger.detach(debuggee, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Debugger detached successfully', {
            target: debuggee,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSendCommand(): void {
    this.server.registerTool(
      'extension_tool_send_debugger_command',
      {
        description: 'Send a Chrome DevTools Protocol command to a debugging target',
        inputSchema: {
          tabId: z.number().optional().describe('The ID of the tab target'),
          extensionId: z.string().optional().describe('The ID of the extension target'),
          targetId: z.string().optional().describe('The opaque ID of the debug target'),
          sessionId: z.string().optional().describe('The session ID for child protocol sessions'),
          method: z.string().describe('CDP method name (e.g., Runtime.evaluate, Page.navigate)'),
          commandParams: z.record(z.any()).optional().describe('Parameters for the CDP command'),
        },
      },
      async ({ tabId, extensionId, targetId, sessionId, method, commandParams }) => {
        try {
          // Validate that at least one target identifier is provided
          if (tabId === undefined && extensionId === undefined && targetId === undefined) {
            return this.formatError(
              'Either tabId, extensionId, or targetId must be specified to send command'
            );
          }

          // Build debugger session object
          const debuggerSession: any = {};
          if (tabId !== undefined) debuggerSession.tabId = tabId;
          if (extensionId !== undefined) debuggerSession.extensionId = extensionId;
          if (targetId !== undefined) debuggerSession.targetId = targetId;
          if (sessionId !== undefined) debuggerSession.sessionId = sessionId;

          // Send command
          const result = await new Promise<any>((resolve, reject) => {
            chrome.debugger.sendCommand(debuggerSession, method, commandParams, (result) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(result);
              }
            });
          });

          return this.formatJson({
            method,
            target: debuggerSession,
            result: result || null,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetTargets(): void {
    this.server.registerTool(
      'extension_tool_get_debug_targets',
      {
        description: 'Get list of available debug targets',
        inputSchema: {},
      },
      async () => {
        try {
          const targets = await new Promise<chrome.debugger.TargetInfo[]>((resolve, reject) => {
            chrome.debugger.getTargets((targets) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(targets);
              }
            });
          });

          return this.formatJson({
            count: targets.length,
            targets: targets.map((target) => ({
              id: target.id,
              type: target.type,
              title: target.title,
              url: target.url,
              attached: target.attached,
              tabId: target.tabId,
              extensionId: target.extensionId,
              faviconUrl: target.faviconUrl,
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
