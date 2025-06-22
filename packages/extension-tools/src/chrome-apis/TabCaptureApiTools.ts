import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface TabCaptureApiToolsOptions {
  capture?: boolean;
  getCapturedTabs?: boolean;
  getMediaStreamId?: boolean;
}

export class TabCaptureApiTools extends BaseApiTools {
  protected apiName = 'TabCapture';

  constructor(server: McpServer, options: TabCaptureApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.tabCapture) {
        return {
          available: false,
          message: 'chrome.tabCapture API is not defined',
          details: 'This extension needs the "tabCapture" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.tabCapture.getCapturedTabs !== 'function') {
        return {
          available: false,
          message: 'chrome.tabCapture.getCapturedTabs is not available',
          details:
            'The tabCapture API appears to be partially available. Check manifest permissions.',
        };
      }

      // Try to actually use the API
      chrome.tabCapture.getCapturedTabs((_tabs) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'TabCapture API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.tabCapture API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('capture')) {
      this.registerCapture();
    }

    if (this.shouldRegisterTool('getCapturedTabs')) {
      this.registerGetCapturedTabs();
    }

    if (this.shouldRegisterTool('getMediaStreamId')) {
      this.registerGetMediaStreamId();
    }
  }

  private registerCapture(): void {
    this.server.registerTool(
      'capture_tab',
      {
        description:
          'Captures the visible area of the currently active tab. Can only be started on the currently active tab after the extension has been invoked.',
        inputSchema: {
          audio: z.boolean().optional().describe('Whether to capture audio from the tab'),
          video: z.boolean().optional().describe('Whether to capture video from the tab'),
          audioConstraints: z
            .object({
              mandatory: z.record(z.any()).optional(),
              optional: z.record(z.any()).optional(),
            })
            .optional()
            .describe('Audio constraints for the media stream'),
          videoConstraints: z
            .object({
              mandatory: z.record(z.any()).optional(),
              optional: z.record(z.any()).optional(),
            })
            .optional()
            .describe('Video constraints for the media stream'),
        },
      },
      async ({ audio, video, audioConstraints, videoConstraints }) => {
        try {
          const options: chrome.tabCapture.CaptureOptions = {};

          if (audio !== undefined) options.audio = audio;
          if (video !== undefined) options.video = video;
          // @ts-expect-error - TODO: fix this
          if (audioConstraints !== undefined) options.audioConstraints = audioConstraints;
          // @ts-expect-error - TODO: fix this
          if (videoConstraints !== undefined) options.videoConstraints = videoConstraints;

          const stream = await new Promise<MediaStream>((resolve, reject) => {
            chrome.tabCapture.capture(options, (stream) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else if (!stream) {
                reject(new Error('Failed to capture tab - no stream returned'));
              } else {
                resolve(stream);
              }
            });
          });

          const audioTracks = stream.getAudioTracks();
          const videoTracks = stream.getVideoTracks();

          return this.formatSuccess('Tab capture started successfully', {
            streamId: stream.id,
            audioTracks: audioTracks.length,
            videoTracks: videoTracks.length,
            audioTrackLabels: audioTracks.map((track) => track.label),
            videoTrackLabels: videoTracks.map((track) => track.label),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetCapturedTabs(): void {
    this.server.registerTool(
      'get_captured_tabs',
      {
        description: 'Returns a list of tabs that have requested capture or are being captured',
        inputSchema: {},
      },
      async () => {
        try {
          const capturedTabs = await new Promise<chrome.tabCapture.CaptureInfo[]>(
            (resolve, reject) => {
              chrome.tabCapture.getCapturedTabs((tabs) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(tabs);
                }
              });
            }
          );

          return this.formatJson({
            count: capturedTabs.length,
            capturedTabs: capturedTabs.map((tab) => ({
              tabId: tab.tabId,
              status: tab.status,
              fullscreen: tab.fullscreen,
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetMediaStreamId(): void {
    this.server.registerTool(
      'get_media_stream_id',
      {
        description:
          'Creates a stream ID to capture the target tab. Returns a media stream ID instead of a media stream.',
        inputSchema: {
          targetTabId: z
            .number()
            .optional()
            .describe(
              'Optional tab id of the tab which will be captured. If not specified then the current active tab will be selected.'
            ),
          consumerTabId: z
            .number()
            .optional()
            .describe(
              'Optional tab id of the tab which will later invoke getUserMedia() to consume the stream. If not specified then the resulting stream can be used only by the calling extension.'
            ),
        },
      },
      async ({ targetTabId, consumerTabId }) => {
        try {
          const options: chrome.tabCapture.GetMediaStreamOptions = {};

          if (targetTabId !== undefined) options.targetTabId = targetTabId;
          if (consumerTabId !== undefined) options.consumerTabId = consumerTabId;

          const streamId = await new Promise<string>((resolve, reject) => {
            chrome.tabCapture.getMediaStreamId(options, (streamId) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else if (!streamId) {
                reject(new Error('Failed to get media stream ID'));
              } else {
                resolve(streamId);
              }
            });
          });

          return this.formatSuccess('Media stream ID created successfully', {
            streamId,
            targetTabId: targetTabId || 'current active tab',
            consumerTabId: consumerTabId || 'calling extension only',
            usage:
              'Use this ID with navigator.mediaDevices.getUserMedia() with chromeMediaSource: "tab" and chromeMediaSourceId: streamId',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
