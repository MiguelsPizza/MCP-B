import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { type ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface TtsApiToolsOptions {
  speak?: boolean;
  stop?: boolean;
  pause?: boolean;
  resume?: boolean;
  isSpeaking?: boolean;
  getVoices?: boolean;
}

export class TtsApiTools extends BaseApiTools {
  protected apiName = 'Tts';

  constructor(server: McpServer, options: TtsApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.tts) {
        return {
          available: false,
          message: 'chrome.tts API is not defined',
          details: 'This extension needs the "tts" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.tts.getVoices !== 'function') {
        return {
          available: false,
          message: 'chrome.tts.getVoices is not available',
          details: 'The tts API appears to be partially available. Check manifest permissions.',
        };
      }

      // Try to actually use the API
      chrome.tts.getVoices((_voices) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'TTS API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.tts API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('speak')) {
      this.registerSpeak();
    }

    if (this.shouldRegisterTool('stop')) {
      this.registerStop();
    }

    if (this.shouldRegisterTool('pause')) {
      this.registerPause();
    }

    if (this.shouldRegisterTool('resume')) {
      this.registerResume();
    }

    if (this.shouldRegisterTool('isSpeaking')) {
      this.registerIsSpeaking();
    }

    if (this.shouldRegisterTool('getVoices')) {
      this.registerGetVoices();
    }
  }

  private registerSpeak(): void {
    this.server.registerTool(
      'extension_tool_speak_text',
      {
        description: 'Speaks text using text-to-speech synthesis',
        inputSchema: {
          utterance: z
            .string()
            .max(32768)
            .describe(
              'The text to speak, either plain text or a complete SSML document. Maximum length is 32,768 characters'
            ),
          lang: z
            .string()
            .optional()
            .describe(
              'The language to be used for synthesis, in the form language-region. Examples: "en", "en-US", "en-GB", "zh-CN"'
            ),
          voiceName: z
            .string()
            .optional()
            .describe(
              'The name of the voice to use for synthesis. If empty, uses any available voice'
            ),
          rate: z
            .number()
            .min(0.1)
            .max(10.0)
            .optional()
            .describe(
              'Speaking rate relative to the default rate. 1.0 is default, 2.0 is twice as fast, 0.5 is half as fast'
            ),
          pitch: z
            .number()
            .min(0)
            .max(2)
            .optional()
            .describe(
              'Speaking pitch between 0 and 2 inclusive, with 0 being lowest and 2 being highest. 1.0 is default'
            ),
          volume: z
            .number()
            .min(0)
            .max(1)
            .optional()
            .describe(
              'Speaking volume between 0 and 1 inclusive, with 0 being lowest and 1 being highest. Default is 1.0'
            ),
          enqueue: z
            .boolean()
            .optional()
            .describe(
              'If true, enqueues this utterance if TTS is already in progress. If false (default), interrupts current speech'
            ),
          extensionId: z
            .string()
            .optional()
            .describe('The extension ID of the speech engine to use, if known'),
          requiredEventTypes: z
            .array(z.string())
            .optional()
            .describe('The TTS event types the voice must support'),
          desiredEventTypes: z
            .array(z.string())
            .optional()
            .describe('The TTS event types that you are interested in listening to'),
        },
      },
      async ({
        utterance,
        lang,
        voiceName,
        rate,
        pitch,
        volume,
        enqueue,
        extensionId,
        requiredEventTypes,
        desiredEventTypes,
      }) => {
        try {
          const options: chrome.tts.TtsOptions = {};

          if (lang !== undefined) options.lang = lang;
          if (voiceName !== undefined) options.voiceName = voiceName;
          if (rate !== undefined) options.rate = rate;
          if (pitch !== undefined) options.pitch = pitch;
          if (volume !== undefined) options.volume = volume;
          if (enqueue !== undefined) options.enqueue = enqueue;
          if (extensionId !== undefined) options.extensionId = extensionId;
          if (requiredEventTypes !== undefined) options.requiredEventTypes = requiredEventTypes;
          if (desiredEventTypes !== undefined) options.desiredEventTypes = desiredEventTypes;

          // Add event listener to capture TTS events
          const events: chrome.tts.TtsEvent[] = [];
          options.onEvent = (event: chrome.tts.TtsEvent) => {
            events.push(event);
          };

          await new Promise<void>((resolve, reject) => {
            chrome.tts.speak(utterance, options, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Text-to-speech started successfully', {
            utterance: utterance.substring(0, 100) + (utterance.length > 100 ? '...' : ''),
            options: {
              lang: options.lang,
              voiceName: options.voiceName,
              rate: options.rate,
              pitch: options.pitch,
              volume: options.volume,
              enqueue: options.enqueue,
            },
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerStop(): void {
    this.server.registerTool(
      'extension_tool_stop_speech',
      {
        description: 'Stops any current speech and flushes the queue of pending utterances',
        inputSchema: {},
      },
      async () => {
        try {
          chrome.tts.stop();
          return this.formatSuccess('Speech stopped and queue cleared');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerPause(): void {
    this.server.registerTool(
      'extension_tool_pause_speech',
      {
        description: 'Pauses speech synthesis, potentially in the middle of an utterance',
        inputSchema: {},
      },
      async () => {
        try {
          chrome.tts.pause();
          return this.formatSuccess('Speech paused');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerResume(): void {
    this.server.registerTool(
      'extension_tool_resume_speech',
      {
        description: 'If speech was paused, resumes speaking where it left off',
        inputSchema: {},
      },
      async () => {
        try {
          chrome.tts.resume();
          return this.formatSuccess('Speech resumed');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerIsSpeaking(): void {
    this.server.registerTool(
      'extension_tool_is_speaking',
      {
        description: 'Checks whether the engine is currently speaking',
        inputSchema: {},
      },
      async () => {
        try {
          const speaking = await new Promise<boolean>((resolve, reject) => {
            chrome.tts.isSpeaking((speaking) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(speaking);
              }
            });
          });

          return this.formatJson({
            speaking: speaking,
            status: speaking ? 'TTS engine is currently speaking' : 'TTS engine is not speaking',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetVoices(): void {
    this.server.registerTool(
      'extension_tool_get_voices',
      {
        description: 'Gets an array of all available voices for speech synthesis',
        inputSchema: {},
      },
      async () => {
        try {
          const voices = await new Promise<chrome.tts.TtsVoice[]>((resolve, reject) => {
            chrome.tts.getVoices((voices) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(voices);
              }
            });
          });

          return this.formatJson({
            count: voices.length,
            voices: voices.map((voice) => ({
              voiceName: voice.voiceName,
              lang: voice.lang,
              extensionId: voice.extensionId,
              eventTypes: voice.eventTypes,
              remote: voice.remote,
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
