import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface AudioApiToolsOptions {
  getDevices?: boolean;
  getMute?: boolean;
  setActiveDevices?: boolean;
  setMute?: boolean;
  setProperties?: boolean;
}

export class AudioApiTools extends BaseApiTools {
  protected apiName = 'Audio';

  constructor(server: McpServer, options: AudioApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.audio) {
        return {
          available: false,
          message: 'chrome.audio API is not defined',
          details:
            'This extension needs the "audio" permission in its manifest.json and only works on ChromeOS',
        };
      }

      // Test a basic method
      if (typeof chrome.audio.getDevices !== 'function') {
        return {
          available: false,
          message: 'chrome.audio.getDevices is not available',
          details:
            'The audio API appears to be partially available. Check manifest permissions and ensure you are on ChromeOS.',
        };
      }

      // Try to actually use the API
      chrome.audio.getDevices({}, (_devices) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'Audio API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.audio API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('getDevices')) {
      this.registerGetDevices();
    }

    if (this.shouldRegisterTool('getMute')) {
      this.registerGetMute();
    }

    if (this.shouldRegisterTool('setActiveDevices')) {
      this.registerSetActiveDevices();
    }

    if (this.shouldRegisterTool('setMute')) {
      this.registerSetMute();
    }

    if (this.shouldRegisterTool('setProperties')) {
      this.registerSetProperties();
    }
  }

  private registerGetDevices(): void {
    this.server.registerTool(
      'extension_tool_get_audio_devices',
      {
        description: 'Get a list of audio devices filtered based on criteria',
        inputSchema: {
          isActive: z
            .boolean()
            .optional()
            .describe(
              'If set, only audio devices whose active state matches this value will be returned'
            ),
          streamTypes: z
            .array(z.enum(['INPUT', 'OUTPUT']))
            .optional()
            .describe(
              'If set, only audio devices whose stream type is included in this list will be returned'
            ),
        },
      },
      async ({ isActive, streamTypes }) => {
        try {
          const filter: chrome.audio.DeviceFilter = {};

          if (isActive !== undefined) {
            filter.isActive = isActive;
          }

          if (streamTypes !== undefined) {
            filter.streamTypes = streamTypes as chrome.audio.StreamType[];
          }

          const devices = await new Promise<chrome.audio.AudioDeviceInfo[]>((resolve, reject) => {
            chrome.audio.getDevices(filter, (devices) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(devices);
              }
            });
          });

          return this.formatJson({
            count: devices.length,
            devices: devices.map((device) => ({
              id: device.id,
              deviceName: device.deviceName,
              deviceType: device.deviceType,
              displayName: device.displayName,
              isActive: device.isActive,
              level: device.level,
              stableDeviceId: device.stableDeviceId,
              streamType: device.streamType,
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetMute(): void {
    this.server.registerTool(
      'extension_tool_get_audio_mute',
      {
        description: 'Get the system-wide mute state for the specified stream type',
        inputSchema: {
          streamType: z
            .enum(['INPUT', 'OUTPUT'])
            .describe('Stream type for which mute state should be fetched'),
        },
      },
      async ({ streamType }) => {
        try {
          const isMuted = await new Promise<boolean>((resolve, reject) => {
            chrome.audio.getMute(streamType, (value) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(value);
              }
            });
          });

          return this.formatJson({
            streamType,
            isMuted,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetActiveDevices(): void {
    this.server.registerTool(
      'extension_tool_set_active_audio_devices',
      {
        description: 'Set lists of active input and/or output devices',
        inputSchema: {
          input: z
            .array(z.string())
            .optional()
            .describe(
              'List of input device IDs that should be active. Leave unset to not affect input devices'
            ),
          output: z
            .array(z.string())
            .optional()
            .describe(
              'List of output device IDs that should be active. Leave unset to not affect output devices'
            ),
        },
      },
      async ({ input, output }) => {
        try {
          if (input === undefined && output === undefined) {
            return this.formatError(
              'At least one of input or output device lists must be specified'
            );
          }

          const deviceIdLists: chrome.audio.DeviceIdLists = {};

          if (input !== undefined) {
            deviceIdLists.input = input;
          }

          if (output !== undefined) {
            deviceIdLists.output = output;
          }

          await new Promise<void>((resolve, reject) => {
            chrome.audio.setActiveDevices(deviceIdLists, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Active audio devices set successfully', {
            inputDevices: input,
            outputDevices: output,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetMute(): void {
    this.server.registerTool(
      'extension_tool_set_audio_mute',
      {
        description:
          'Set mute state for a stream type. The mute state will apply to all audio devices with the specified audio stream type',
        inputSchema: {
          streamType: z
            .enum(['INPUT', 'OUTPUT'])
            .describe('Stream type for which mute state should be set'),
          isMuted: z.boolean().describe('New mute value'),
        },
      },
      async ({ streamType, isMuted }) => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.audio.setMute(streamType, isMuted, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Audio mute state set successfully', {
            streamType,
            isMuted,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetProperties(): void {
    this.server.registerTool(
      'extension_tool_set_audio_device_properties',
      {
        description: 'Set the properties for the input or output device',
        inputSchema: {
          id: z.string().describe('ID of the audio device to modify'),
          level: z
            .number()
            .min(0)
            .max(100)
            .optional()
            .describe(
              "The audio device's desired sound level. For input devices, represents gain. For output devices, represents volume"
            ),
        },
      },
      async ({ id, level }) => {
        try {
          const properties: chrome.audio.DeviceProperties = {};

          if (level !== undefined) {
            properties.level = level;
          }

          await new Promise<void>((resolve, reject) => {
            chrome.audio.setProperties(id, properties, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Audio device properties set successfully', {
            deviceId: id,
            level,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
