import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface IdleApiToolsOptions {
  queryState?: boolean;
  setDetectionInterval?: boolean;
  getAutoLockDelay?: boolean;
}

export class IdleApiTools extends BaseApiTools {
  protected apiName = 'Idle';

  constructor(
    server: McpServer,
    options: IdleApiToolsOptions = {}
  ) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.idle) {
        return {
          available: false,
          message: 'chrome.idle API is not defined',
          details: 'This extension needs the "idle" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.idle.queryState !== 'function') {
        return {
          available: false,
          message: 'chrome.idle.queryState is not available',
          details: 'The idle API appears to be partially available. Check manifest permissions.',
        };
      }

      // Try to actually use the API
      chrome.idle.queryState(60, (_state) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'Idle API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.idle API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('queryState')) {
      this.registerQueryState();
    }

    if (this.shouldRegisterTool('setDetectionInterval')) {
      this.registerSetDetectionInterval();
    }

    if (this.shouldRegisterTool('getAutoLockDelay')) {
      this.registerGetAutoLockDelay();
    }
  }

  private registerQueryState(): void {
    this.server.registerTool(
      'query_idle_state',
      {
        description: 'Query the current idle state of the system. Returns "locked" if the system is locked, "idle" if the user has not generated input for the specified time, or "active" otherwise.',
        inputSchema: {
          detectionIntervalInSeconds: z
            .number()
            .min(15)
            .default(60)
            .describe(
              'The system is considered idle if this many seconds have elapsed since the last user input detected. Minimum is 15 seconds.'
            ),
        },
      },
      async ({ detectionIntervalInSeconds }) => {
        try {
          const state = await new Promise<chrome.idle.IdleState>((resolve, reject) => {
            chrome.idle.queryState(detectionIntervalInSeconds, (newState) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(newState);
              }
            });
          });

          return this.formatJson({
            state: state,
            detectionIntervalInSeconds: detectionIntervalInSeconds,
            timestamp: Date.now(),
            timestampFormatted: new Date().toISOString(),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetDetectionInterval(): void {
    this.server.registerTool(
      'set_idle_detection_interval',
      {
        description: 'Set the interval used to determine when the system is in an idle state for onStateChanged events. The default interval is 60 seconds.',
        inputSchema: {
          intervalInSeconds: z
            .number()
            .min(15)
            .describe(
              'Threshold, in seconds, used to determine when the system is in an idle state. Minimum is 15 seconds.'
            ),
        },
      },
      async ({ intervalInSeconds }) => {
        try {
          chrome.idle.setDetectionInterval(intervalInSeconds);

          return this.formatSuccess('Idle detection interval set successfully', {
            intervalInSeconds: intervalInSeconds,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetAutoLockDelay(): void {
    this.server.registerTool(
      'get_auto_lock_delay',
      {
        description: 'Get the time, in seconds, it takes until the screen is locked automatically while idle. Returns zero if the screen is never locked automatically. Currently supported on Chrome OS only.',
        inputSchema: {},
      },
      async () => {
        try {
          // Check if the method exists (Chrome 73+ and ChromeOS only)
          if (typeof chrome.idle.getAutoLockDelay !== 'function') {
            return this.formatError(
              'getAutoLockDelay is not available. This method requires Chrome 73+ and is currently supported on Chrome OS only.'
            );
          }

          const delay = await new Promise<number>((resolve, reject) => {
            chrome.idle.getAutoLockDelay((delay) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(delay);
              }
            });
          });

          return this.formatJson({
            autoLockDelaySeconds: delay,
            autoLockEnabled: delay > 0,
            autoLockDelayFormatted: delay > 0 ? `${delay} seconds` : 'Never locks automatically',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}