import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface PowerApiToolsOptions {
  requestKeepAwake?: boolean;
  releaseKeepAwake?: boolean;
  reportActivity?: boolean;
}

export class PowerApiTools extends BaseApiTools {
  protected apiName = 'Power';

  constructor(server: McpServer, options: PowerApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.power) {
        return {
          available: false,
          message: 'chrome.power API is not defined',
          details: 'This extension needs the "power" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.power.requestKeepAwake !== 'function') {
        return {
          available: false,
          message: 'chrome.power.requestKeepAwake is not available',
          details: 'The power API appears to be partially available. Check manifest permissions.',
        };
      }

      // Try to actually use the API
      chrome.power.requestKeepAwake('system');
      chrome.power.releaseKeepAwake();

      return {
        available: true,
        message: 'Power API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.power API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('requestKeepAwake')) {
      this.registerRequestKeepAwake();
    }

    if (this.shouldRegisterTool('releaseKeepAwake')) {
      this.registerReleaseKeepAwake();
    }

    if (this.shouldRegisterTool('reportActivity')) {
      this.registerReportActivity();
    }
  }

  private registerRequestKeepAwake(): void {
    this.server.registerTool(
      'request_keep_awake',
      {
        description:
          'Request that power management be temporarily disabled to keep the system or display awake',
        inputSchema: {
          level: z
            .enum(['system', 'display'])
            .describe(
              'Level of power management to disable. "system" prevents system sleep but allows screen dimming. "display" prevents both system sleep and screen dimming/turning off'
            ),
        },
      },
      async ({ level }) => {
        try {
          chrome.power.requestKeepAwake(level as chrome.power.Level);

          return this.formatSuccess('Power management request activated', {
            level,
            description:
              level === 'system'
                ? 'System will stay awake but screen may dim or turn off'
                : 'Both system and display will stay awake',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerReleaseKeepAwake(): void {
    this.server.registerTool(
      'release_keep_awake',
      {
        description:
          'Release a previously made power management request, allowing normal power management to resume',
        inputSchema: {},
      },
      async () => {
        try {
          chrome.power.releaseKeepAwake();

          return this.formatSuccess('Power management request released', {
            description: 'Normal power management behavior has been restored',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerReportActivity(): void {
    this.server.registerTool(
      'report_activity',
      {
        description:
          'Report user activity to wake the screen from dimmed/off state or exit screensaver (ChromeOS only)',
        inputSchema: {},
      },
      async () => {
        try {
          // Check if reportActivity is available (Chrome 113+ ChromeOS only)
          if (typeof chrome.power.reportActivity !== 'function') {
            return this.formatError(
              'reportActivity is not available. This method requires Chrome 113+ on ChromeOS'
            );
          }

          await new Promise<void>((resolve, reject) => {
            chrome.power.reportActivity(() => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('User activity reported', {
            description: 'Screen should wake from dimmed/off state and exit screensaver if active',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
