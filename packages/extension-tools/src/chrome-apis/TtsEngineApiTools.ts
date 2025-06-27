import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface TtsEngineApiToolsOptions {
  updateVoices?: boolean;
  updateLanguage?: boolean;
  onSpeak?: boolean;
  onStop?: boolean;
  onPause?: boolean;
  onResume?: boolean;
  onSpeakWithAudioStream?: boolean;
  onInstallLanguageRequest?: boolean;
  onLanguageStatusRequest?: boolean;
  onUninstallLanguageRequest?: boolean;
}

export class TtsEngineApiTools extends BaseApiTools {
  protected apiName = 'TtsEngine';

  constructor(server: McpServer, options: TtsEngineApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.ttsEngine) {
        return {
          available: false,
          message: 'chrome.ttsEngine API is not defined',
          details: 'This extension needs the "ttsEngine" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.ttsEngine.updateVoices !== 'function') {
        return {
          available: false,
          message: 'chrome.ttsEngine.updateVoices is not available',
          details:
            'The ttsEngine API appears to be partially available. Check manifest permissions.',
        };
      }

      // Check if events are available
      if (!chrome.ttsEngine.onSpeak || !chrome.ttsEngine.onStop) {
        return {
          available: false,
          message: 'chrome.ttsEngine events are not available',
          details: 'The ttsEngine API requires event listeners to be available.',
        };
      }

      return {
        available: true,
        message: 'TtsEngine API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.ttsEngine API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('updateVoices')) {
      this.registerUpdateVoices();
    }

    if (this.shouldRegisterTool('updateLanguage')) {
      this.registerUpdateLanguage();
    }

    if (this.shouldRegisterTool('onSpeak')) {
      this.registerOnSpeak();
    }

    if (this.shouldRegisterTool('onStop')) {
      this.registerOnStop();
    }

    if (this.shouldRegisterTool('onPause')) {
      this.registerOnPause();
    }

    if (this.shouldRegisterTool('onResume')) {
      this.registerOnResume();
    }

    if (this.shouldRegisterTool('onSpeakWithAudioStream')) {
      this.registerOnSpeakWithAudioStream();
    }

    if (this.shouldRegisterTool('onInstallLanguageRequest')) {
      this.registerOnInstallLanguageRequest();
    }

    if (this.shouldRegisterTool('onLanguageStatusRequest')) {
      this.registerOnLanguageStatusRequest();
    }

    if (this.shouldRegisterTool('onUninstallLanguageRequest')) {
      this.registerOnUninstallLanguageRequest();
    }
  }

  private registerUpdateVoices(): void {
    this.server.registerTool(
      'extension_tool_update_voices',
      {
        description: 'Update the list of voices available for speech synthesis',
        inputSchema: {
          voices: z
            .array(
              z.object({
                voiceName: z.string().describe('The name of the voice'),
                lang: z.string().optional().describe('Language code (e.g., en-US)'),
                gender: z.enum(['male', 'female']).optional().describe('Voice gender (deprecated)'),
                remote: z.boolean().optional().describe('Whether the voice is remote'),
                extensionId: z.string().optional().describe('Extension ID providing the voice'),
                eventTypes: z.array(z.string()).optional().describe('Supported event types'),
              })
            )
            .describe('Array of voice objects to register'),
        },
      },
      async ({ voices }) => {
        try {
          // @ts-expect-error - TODO: fix this
          chrome.ttsEngine.updateVoices(voices);

          return this.formatSuccess('Voices updated successfully', {
            voiceCount: voices.length,
            voices: voices.map((voice) => ({
              name: voice.voiceName,
              lang: voice.lang,
              eventTypes: voice.eventTypes,
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerUpdateLanguage(): void {
    this.server.registerTool(
      'extension_tool_update_language',
      {
        description: 'Update the installation status of a language',
        inputSchema: {
          lang: z.string().describe('Language code (e.g., en-US)'),
          installStatus: z
            .enum(['notInstalled', 'installing', 'installed', 'failed'])
            .describe('Installation status'),
          error: z.string().optional().describe('Error message if installation failed'),
        },
      },
      async ({ lang, installStatus, error }) => {
        try {
          const status: chrome.ttsEngine.LanguageStatus = {
            lang,
            installStatus,
          };

          if (error !== undefined) {
            status.error = error;
          }

          chrome.ttsEngine.updateLanguage(status);

          return this.formatSuccess('Language status updated successfully', {
            lang,
            installStatus,
            error,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerOnSpeak(): void {
    this.server.registerTool(
      'extension_tool_register_speak_listener',
      {
        description: 'Register a listener for speak events from the TTS engine',
        inputSchema: {},
      },
      async () => {
        try {
          const speakListener = (
            utterance: string,
            _options: chrome.ttsEngine.SpeakOptions,
            sendTtsEvent: (event: chrome.tts.TtsEvent) => void
          ) => {
            // Send start event
            sendTtsEvent({ type: 'start', charIndex: 0 });

            // Simulate speech processing
            setTimeout(() => {
              sendTtsEvent({ type: 'end', charIndex: utterance.length });
            }, 1000);
          };

          chrome.ttsEngine.onSpeak.addListener(speakListener);

          return this.formatSuccess('Speak listener registered successfully');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerOnStop(): void {
    this.server.registerTool(
      'extension_tool_register_stop_listener',
      {
        description: 'Register a listener for stop events from the TTS engine',
        inputSchema: {},
      },
      async () => {
        try {
          const stopListener = () => {
            // Handle stop speech
          };

          chrome.ttsEngine.onStop.addListener(stopListener);

          return this.formatSuccess('Stop listener registered successfully');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerOnPause(): void {
    this.server.registerTool(
      'extension_tool_register_pause_listener',
      {
        description: 'Register a listener for pause events from the TTS engine',
        inputSchema: {},
      },
      async () => {
        try {
          const pauseListener = () => {
            // Handle pause speech
          };

          chrome.ttsEngine.onPause.addListener(pauseListener);

          return this.formatSuccess('Pause listener registered successfully');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerOnResume(): void {
    this.server.registerTool(
      'extension_tool_register_resume_listener',
      {
        description: 'Register a listener for resume events from the TTS engine',
        inputSchema: {},
      },
      async () => {
        try {
          const resumeListener = () => {
            // Handle resume speech
          };

          chrome.ttsEngine.onResume.addListener(resumeListener);

          return this.formatSuccess('Resume listener registered successfully');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerOnSpeakWithAudioStream(): void {
    this.server.registerTool(
      'extension_tool_register_speak_audio_stream_listener',
      {
        description: 'Register a listener for speak events with audio stream support',
        inputSchema: {},
      },
      async () => {
        try {
          const speakWithAudioStreamListener = (
            _utterance: string,
            _options: chrome.ttsEngine.SpeakOptions,
            audioStreamOptions: chrome.ttsEngine.AudioStreamOptions,
            sendTtsAudio: (audioBufferParams: chrome.ttsEngine.AudioBuffer) => void,
            sendError: (errorMessage?: string) => void
          ) => {
            try {
              // Create a simple audio buffer (silence)
              const bufferSize = audioStreamOptions.bufferSize;
              const audioBuffer = new ArrayBuffer(bufferSize * 4); // 32-bit float

              sendTtsAudio({
                audioBuffer,
                charIndex: 0,
                isLastBuffer: true,
              });
            } catch (error) {
              sendError(error instanceof Error ? error.message : 'Unknown error');
            }
          };

          chrome.ttsEngine.onSpeakWithAudioStream.addListener(speakWithAudioStreamListener);

          return this.formatSuccess('Speak with audio stream listener registered successfully');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerOnInstallLanguageRequest(): void {
    this.server.registerTool(
      'extension_tool_register_install_language_listener',
      {
        description: 'Register a listener for language installation requests',
        inputSchema: {},
      },
      async () => {
        try {
          const installLanguageListener = (
            _requestor: chrome.ttsEngine.TtsClient,
            lang: string
          ) => {
            // Handle language installation request
            // Update language status after processing
            chrome.ttsEngine.updateLanguage({
              lang,
              installStatus: 'installing',
            });
          };

          chrome.ttsEngine.onInstallLanguageRequest.addListener(installLanguageListener);

          return this.formatSuccess('Install language listener registered successfully');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerOnLanguageStatusRequest(): void {
    this.server.registerTool(
      'extension_tool_register_language_status_listener',
      {
        description: 'Register a listener for language status requests',
        inputSchema: {},
      },
      async () => {
        try {
          const languageStatusListener = (_requestor: chrome.ttsEngine.TtsClient, lang: string) => {
            // Handle language status request
            chrome.ttsEngine.updateLanguage({
              lang,
              installStatus: 'installed',
            });
          };

          chrome.ttsEngine.onLanguageStatusRequest.addListener(languageStatusListener);

          return this.formatSuccess('Language status listener registered successfully');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerOnUninstallLanguageRequest(): void {
    this.server.registerTool(
      'extension_tool_register_uninstall_language_listener',
      {
        description: 'Register a listener for language uninstallation requests',
        inputSchema: {},
      },
      async () => {
        try {
          const uninstallLanguageListener = (
            _requestor: chrome.ttsEngine.TtsClient,
            lang: string,
            uninstallOptions: chrome.ttsEngine.LanguageUninstallOptions
          ) => {
            // Handle language uninstallation request
            if (uninstallOptions.uninstallImmediately) {
              chrome.ttsEngine.updateLanguage({
                lang,
                installStatus: 'notInstalled',
              });
            }
          };

          chrome.ttsEngine.onUninstallLanguageRequest.addListener(uninstallLanguageListener);

          return this.formatSuccess('Uninstall language listener registered successfully');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
