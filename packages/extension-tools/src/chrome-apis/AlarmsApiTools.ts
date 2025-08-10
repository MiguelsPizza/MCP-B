import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v3';
import { type ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface AlarmsApiToolsOptions {
  createAlarm?: boolean;
  getAlarm?: boolean;
  getAllAlarms?: boolean;
  clearAlarm?: boolean;
  clearAllAlarms?: boolean;
}

export class AlarmsApiTools extends BaseApiTools {
  protected apiName = 'Alarms';

  constructor(server: McpServer, options: AlarmsApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.alarms) {
        return {
          available: false,
          message: 'chrome.alarms API is not defined',
          details: 'This extension needs the "alarms" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.alarms.getAll !== 'function') {
        return {
          available: false,
          message: 'chrome.alarms.getAll is not available',
          details: 'The alarms API appears to be partially available. Check manifest permissions.',
        };
      }

      // Try to actually use the API
      chrome.alarms.getAll((_alarms) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'Alarms API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.alarms API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('createAlarm')) {
      this.registerCreateAlarm();
    }

    if (this.shouldRegisterTool('getAlarm')) {
      this.registerGetAlarm();
    }

    if (this.shouldRegisterTool('getAllAlarms')) {
      this.registerGetAllAlarms();
    }

    if (this.shouldRegisterTool('clearAlarm')) {
      this.registerClearAlarm();
    }

    if (this.shouldRegisterTool('clearAllAlarms')) {
      this.registerClearAllAlarms();
    }
  }

  private registerCreateAlarm(): void {
    this.server.registerTool(
      'extension_tool_create_alarm',
      {
        description: 'Create an alarm that fires at a specific time or periodically',
        inputSchema: {
          name: z.string().optional().describe('Optional name to identify this alarm'),
          delayInMinutes: z
            .number()
            .min(0.5)
            .optional()
            .describe(
              'Time in minutes from now when the alarm should first fire. Minimum is 0.5 minutes (30 seconds)'
            ),
          periodInMinutes: z
            .number()
            .min(0.5)
            .optional()
            .describe(
              'If set, the alarm will repeat every periodInMinutes minutes after the initial event. Minimum is 0.5 minutes (30 seconds)'
            ),
          when: z
            .number()
            .optional()
            .describe(
              'Time at which the alarm should fire, in milliseconds past the epoch (e.g. Date.now() + n)'
            ),
        },
      },
      async ({ name, delayInMinutes, periodInMinutes, when }) => {
        try {
          // Validate that at least one timing option is provided
          if (delayInMinutes === undefined && when === undefined) {
            return this.formatError(
              'Either delayInMinutes or when must be specified to create an alarm'
            );
          }

          // Build alarm info
          const alarmInfo: chrome.alarms.AlarmCreateInfo = {};

          if (delayInMinutes !== undefined) {
            alarmInfo.delayInMinutes = delayInMinutes;
          }

          if (periodInMinutes !== undefined) {
            alarmInfo.periodInMinutes = periodInMinutes;
          }

          if (when !== undefined) {
            alarmInfo.when = when;
          }

          // Create the alarm
          await new Promise<void>((resolve, reject) => {
            if (name) {
              chrome.alarms.create(name, alarmInfo, () => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve();
                }
              });
            } else {
              chrome.alarms.create(alarmInfo, () => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve();
                }
              });
            }
          });

          // Get the created alarm to return its details
          const createdAlarm = await new Promise<chrome.alarms.Alarm | undefined>(
            (resolve, reject) => {
              chrome.alarms.get(name || '', (alarm) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(alarm);
                }
              });
            }
          );

          return this.formatSuccess('Alarm created successfully', {
            name: createdAlarm?.name || name || 'unnamed',
            scheduledTime: createdAlarm?.scheduledTime,
            periodInMinutes: createdAlarm?.periodInMinutes,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetAlarm(): void {
    this.server.registerTool(
      'extension_tool_get_alarm',
      {
        description: 'Get details about a specific alarm',
        inputSchema: {
          name: z
            .string()
            .optional()
            .describe(
              'Name of the alarm to retrieve. If not specified, gets the default unnamed alarm'
            ),
        },
      },
      async ({ name }) => {
        try {
          const alarm = await new Promise<chrome.alarms.Alarm | undefined>((resolve, reject) => {
            if (name) {
              chrome.alarms.get(name, (alarm) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(alarm);
                }
              });
            } else {
              chrome.alarms.get((alarm) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(alarm);
                }
              });
            }
          });

          if (!alarm) {
            return this.formatSuccess('No alarm found', { name: name || 'unnamed' });
          }

          return this.formatJson({
            name: alarm.name,
            scheduledTime: alarm.scheduledTime,
            scheduledTimeFormatted: new Date(alarm.scheduledTime).toISOString(),
            periodInMinutes: alarm.periodInMinutes,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetAllAlarms(): void {
    this.server.registerTool(
      'extension_tool_get_all_alarms',
      {
        description: 'Get all active alarms',
        inputSchema: {},
      },
      async () => {
        try {
          const alarms = await new Promise<chrome.alarms.Alarm[]>((resolve, reject) => {
            chrome.alarms.getAll((alarms) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(alarms);
              }
            });
          });

          return this.formatJson({
            count: alarms.length,
            alarms: alarms.map((alarm) => ({
              name: alarm.name,
              scheduledTime: alarm.scheduledTime,
              scheduledTimeFormatted: new Date(alarm.scheduledTime).toISOString(),
              periodInMinutes: alarm.periodInMinutes,
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerClearAlarm(): void {
    this.server.registerTool(
      'extension_tool_clear_alarm',
      {
        description: 'Clear a specific alarm',
        inputSchema: {
          name: z
            .string()
            .optional()
            .describe(
              'Name of the alarm to clear. If not specified, clears the default unnamed alarm'
            ),
        },
      },
      async ({ name }) => {
        try {
          const wasCleared = await new Promise<boolean>((resolve, reject) => {
            if (name) {
              chrome.alarms.clear(name, (wasCleared) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(wasCleared);
                }
              });
            } else {
              chrome.alarms.clear((wasCleared) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(wasCleared);
                }
              });
            }
          });

          if (wasCleared) {
            return this.formatSuccess('Alarm cleared successfully', { name: name || 'unnamed' });
          } else {
            return this.formatSuccess('No alarm found to clear', { name: name || 'unnamed' });
          }
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerClearAllAlarms(): void {
    this.server.registerTool(
      'extension_tool_clear_all_alarms',
      {
        description: 'Clear all alarms',
        inputSchema: {},
      },
      async () => {
        try {
          // Get all alarms first to know what we're clearing
          const alarmsBefore = await new Promise<chrome.alarms.Alarm[]>((resolve, reject) => {
            chrome.alarms.getAll((alarms) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(alarms);
              }
            });
          });

          const wasCleared = await new Promise<boolean>((resolve, reject) => {
            chrome.alarms.clearAll((wasCleared) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(wasCleared);
              }
            });
          });

          if (wasCleared) {
            return this.formatSuccess('All alarms cleared successfully', {
              clearedCount: alarmsBefore.length,
              clearedAlarms: alarmsBefore.map((alarm) => alarm.name),
            });
          } else {
            return this.formatSuccess('No alarms to clear');
          }
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
