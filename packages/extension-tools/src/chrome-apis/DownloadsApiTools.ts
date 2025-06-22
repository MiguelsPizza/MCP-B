import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface DownloadsApiToolsOptions {
  download?: boolean;
  search?: boolean;
  pause?: boolean;
  resume?: boolean;
  cancel?: boolean;
  getFileIcon?: boolean;
  open?: boolean;
  show?: boolean;
  showDefaultFolder?: boolean;
  erase?: boolean;
  removeFile?: boolean;
  acceptDanger?: boolean;
  setUiOptions?: boolean;
}

export class DownloadsApiTools extends BaseApiTools {
  protected apiName = 'Downloads';

  constructor(server: McpServer, options: DownloadsApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.downloads) {
        return {
          available: false,
          message: 'chrome.downloads API is not defined',
          details: 'This extension needs the "downloads" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.downloads.search !== 'function') {
        return {
          available: false,
          message: 'chrome.downloads.search is not available',
          details:
            'The downloads API appears to be partially available. Check manifest permissions.',
        };
      }

      // Try to actually use the API
      chrome.downloads.search({}, (_downloads) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'Downloads API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.downloads API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('download')) {
      this.registerDownload();
    }

    if (this.shouldRegisterTool('search')) {
      this.registerSearch();
    }

    if (this.shouldRegisterTool('pause')) {
      this.registerPause();
    }

    if (this.shouldRegisterTool('resume')) {
      this.registerResume();
    }

    if (this.shouldRegisterTool('cancel')) {
      this.registerCancel();
    }

    if (this.shouldRegisterTool('getFileIcon')) {
      this.registerGetFileIcon();
    }

    if (this.shouldRegisterTool('open')) {
      this.registerOpen();
    }

    if (this.shouldRegisterTool('show')) {
      this.registerShow();
    }

    if (this.shouldRegisterTool('showDefaultFolder')) {
      this.registerShowDefaultFolder();
    }

    if (this.shouldRegisterTool('erase')) {
      this.registerErase();
    }

    if (this.shouldRegisterTool('removeFile')) {
      this.registerRemoveFile();
    }

    if (this.shouldRegisterTool('acceptDanger')) {
      this.registerAcceptDanger();
    }

    if (this.shouldRegisterTool('setUiOptions')) {
      this.registerSetUiOptions();
    }
  }

  private registerDownload(): void {
    this.server.registerTool(
      'download_file',
      {
        description: 'Download a file from a URL',
        inputSchema: {
          url: z.string().url().describe('The URL to download'),
          filename: z
            .string()
            .optional()
            .describe(
              'A file path relative to the Downloads directory to contain the downloaded file'
            ),
          saveAs: z
            .boolean()
            .optional()
            .describe('Use a file-chooser to allow the user to select a filename'),
          method: z
            .enum(['GET', 'POST'])
            .optional()
            .describe('The HTTP method to use if the URL uses the HTTP[S] protocol'),
          headers: z
            .array(
              z.object({
                name: z.string().describe('Name of the HTTP header'),
                value: z.string().describe('Value of the HTTP header'),
              })
            )
            .optional()
            .describe('Extra HTTP headers to send with the request'),
          body: z.string().optional().describe('Post body'),
          conflictAction: z
            .enum(['uniquify', 'overwrite', 'prompt'])
            .optional()
            .describe('The action to take if filename already exists'),
        },
      },
      async ({ url, filename, saveAs, method, headers, body, conflictAction }) => {
        try {
          const options: chrome.downloads.DownloadOptions = { url };

          if (filename !== undefined) options.filename = filename;
          if (saveAs !== undefined) options.saveAs = saveAs;
          if (method !== undefined) options.method = method;
          if (headers !== undefined) options.headers = headers;
          if (body !== undefined) options.body = body;
          if (conflictAction !== undefined) options.conflictAction = conflictAction;

          const downloadId = await new Promise<number>((resolve, reject) => {
            chrome.downloads.download(options, (downloadId) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(downloadId);
              }
            });
          });

          return this.formatSuccess('Download started successfully', {
            downloadId,
            url,
            filename: filename || 'auto-generated',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSearch(): void {
    this.server.registerTool(
      'search_downloads',
      {
        description: 'Search for downloads matching specified criteria',
        inputSchema: {
          id: z.number().optional().describe('The id of the DownloadItem to query'),
          url: z.string().optional().describe('The absolute URL that this download initiated from'),
          urlRegex: z
            .string()
            .optional()
            .describe(
              'Limits results to DownloadItem whose url matches the given regular expression'
            ),
          filename: z.string().optional().describe('Absolute local path'),
          filenameRegex: z
            .string()
            .optional()
            .describe(
              'Limits results to DownloadItem whose filename matches the given regular expression'
            ),
          query: z
            .array(z.string())
            .optional()
            .describe(
              'Search terms that must be contained in filename or url. Terms beginning with dash are excluded'
            ),
          state: z
            .enum(['in_progress', 'interrupted', 'complete'])
            .optional()
            .describe('Indicates whether the download is progressing, interrupted, or complete'),
          danger: z
            .enum(['file', 'url', 'content', 'uncommon', 'host', 'unwanted', 'safe', 'accepted'])
            .optional()
            .describe('Indication of whether this download is thought to be safe or suspicious'),
          mime: z.string().optional().describe("The file's MIME type"),
          startTime: z
            .string()
            .optional()
            .describe('The time when the download began in ISO 8601 format'),
          endTime: z
            .string()
            .optional()
            .describe('The time when the download ended in ISO 8601 format'),
          startedAfter: z
            .string()
            .optional()
            .describe(
              'Limits results to DownloadItem that started after the given time in ISO 8601 format'
            ),
          startedBefore: z
            .string()
            .optional()
            .describe(
              'Limits results to DownloadItem that started before the given time in ISO 8601 format'
            ),
          endedAfter: z
            .string()
            .optional()
            .describe(
              'Limits results to DownloadItem that ended after the given time in ISO 8601 format'
            ),
          endedBefore: z
            .string()
            .optional()
            .describe(
              'Limits results to DownloadItem that ended before the given time in ISO 8601 format'
            ),
          totalBytesGreater: z
            .number()
            .optional()
            .describe(
              'Limits results to DownloadItem whose totalBytes is greater than the given integer'
            ),
          totalBytesLess: z
            .number()
            .optional()
            .describe(
              'Limits results to DownloadItem whose totalBytes is less than the given integer'
            ),
          exists: z.boolean().optional().describe('Whether the downloaded file exists'),
          limit: z
            .number()
            .optional()
            .describe('The maximum number of matching DownloadItem returned. Defaults to 1000'),
          orderBy: z
            .array(z.string())
            .optional()
            .describe(
              'Set elements to DownloadItem properties to sort results. Prefix with hyphen for descending order'
            ),
        },
      },
      async (params) => {
        try {
          const query: chrome.downloads.DownloadQuery = {};

          // Map all the optional parameters
          if (params.id !== undefined) query.id = params.id;
          if (params.url !== undefined) query.url = params.url;
          if (params.urlRegex !== undefined) query.urlRegex = params.urlRegex;
          if (params.filename !== undefined) query.filename = params.filename;
          if (params.filenameRegex !== undefined) query.filenameRegex = params.filenameRegex;
          if (params.query !== undefined) query.query = params.query;
          if (params.state !== undefined) query.state = params.state;
          if (params.danger !== undefined) query.danger = params.danger;
          if (params.mime !== undefined) query.mime = params.mime;
          if (params.startTime !== undefined) query.startTime = params.startTime;
          if (params.endTime !== undefined) query.endTime = params.endTime;
          if (params.startedAfter !== undefined) query.startedAfter = params.startedAfter;
          if (params.startedBefore !== undefined) query.startedBefore = params.startedBefore;
          if (params.endedAfter !== undefined) query.endedAfter = params.endedAfter;
          if (params.endedBefore !== undefined) query.endedBefore = params.endedBefore;
          if (params.totalBytesGreater !== undefined)
            query.totalBytesGreater = params.totalBytesGreater;
          if (params.totalBytesLess !== undefined) query.totalBytesLess = params.totalBytesLess;
          if (params.exists !== undefined) query.exists = params.exists;
          if (params.limit !== undefined) query.limit = params.limit;
          if (params.orderBy !== undefined) query.orderBy = params.orderBy;

          const downloads = await new Promise<chrome.downloads.DownloadItem[]>(
            (resolve, reject) => {
              chrome.downloads.search(query, (downloads) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(downloads);
                }
              });
            }
          );

          return this.formatJson({
            count: downloads.length,
            downloads: downloads.map((download) => ({
              id: download.id,
              url: download.url,
              finalUrl: download.finalUrl,
              filename: download.filename,
              incognito: download.incognito,
              danger: download.danger,
              mime: download.mime,
              startTime: download.startTime,
              endTime: download.endTime,
              estimatedEndTime: download.estimatedEndTime,
              state: download.state,
              paused: download.paused,
              canResume: download.canResume,
              error: download.error,
              bytesReceived: download.bytesReceived,
              totalBytes: download.totalBytes,
              fileSize: download.fileSize,
              exists: download.exists,
              byExtensionId: download.byExtensionId,
              byExtensionName: download.byExtensionName,
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerPause(): void {
    this.server.registerTool(
      'pause_download',
      {
        description: 'Pause a download',
        inputSchema: {
          downloadId: z.number().describe('The id of the download to pause'),
        },
      },
      async ({ downloadId }) => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.downloads.pause(downloadId, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Download paused successfully', { downloadId });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerResume(): void {
    this.server.registerTool(
      'resume_download',
      {
        description: 'Resume a paused download',
        inputSchema: {
          downloadId: z.number().describe('The id of the download to resume'),
        },
      },
      async ({ downloadId }) => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.downloads.resume(downloadId, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Download resumed successfully', { downloadId });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerCancel(): void {
    this.server.registerTool(
      'cancel_download',
      {
        description: 'Cancel a download',
        inputSchema: {
          downloadId: z.number().describe('The id of the download to cancel'),
        },
      },
      async ({ downloadId }) => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.downloads.cancel(downloadId, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Download cancelled successfully', { downloadId });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetFileIcon(): void {
    this.server.registerTool(
      'get_file_icon',
      {
        description: 'Retrieve an icon for the specified download',
        inputSchema: {
          downloadId: z.number().describe('The identifier for the download'),
          size: z
            .number()
            .optional()
            .describe(
              'The size of the returned icon. Supported sizes are 16 and 32. Default is 32'
            ),
        },
      },
      async ({ downloadId, size }) => {
        try {
          const options: chrome.downloads.GetFileIconOptions = {};
          if (size !== undefined) options.size = size as 16 | 32 | undefined;

          const iconURL = await new Promise<string | undefined>((resolve, reject) => {
            chrome.downloads.getFileIcon(downloadId, options, (iconURL) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(iconURL);
              }
            });
          });

          return this.formatJson({
            downloadId,
            iconURL: iconURL || null,
            size: size || 32,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerOpen(): void {
    this.server.registerTool(
      'open_download',
      {
        description: 'Open the downloaded file if the download is complete',
        inputSchema: {
          downloadId: z.number().describe('The identifier for the downloaded file'),
        },
      },
      async ({ downloadId }) => {
        try {
          chrome.downloads.open(downloadId);
          return this.formatSuccess('Download opened successfully', { downloadId });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerShow(): void {
    this.server.registerTool(
      'show_download',
      {
        description: 'Show the downloaded file in its folder in a file manager',
        inputSchema: {
          downloadId: z.number().describe('The identifier for the downloaded file'),
        },
      },
      async ({ downloadId }) => {
        try {
          chrome.downloads.show(downloadId);
          return this.formatSuccess('Download shown in file manager', { downloadId });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerShowDefaultFolder(): void {
    this.server.registerTool(
      'show_default_folder',
      {
        description: 'Show the default Downloads folder in a file manager',
        inputSchema: {},
      },
      async () => {
        try {
          chrome.downloads.showDefaultFolder();
          return this.formatSuccess('Default Downloads folder shown in file manager');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerErase(): void {
    this.server.registerTool(
      'erase_downloads',
      {
        description: 'Erase matching downloads from history without deleting the downloaded files',
        inputSchema: {
          id: z.number().optional().describe('The id of the DownloadItem to erase'),
          url: z.string().optional().describe('The absolute URL that this download initiated from'),
          urlRegex: z
            .string()
            .optional()
            .describe(
              'Limits results to DownloadItem whose url matches the given regular expression'
            ),
          filename: z.string().optional().describe('Absolute local path'),
          filenameRegex: z
            .string()
            .optional()
            .describe(
              'Limits results to DownloadItem whose filename matches the given regular expression'
            ),
          state: z
            .enum(['in_progress', 'interrupted', 'complete'])
            .optional()
            .describe('Indicates whether the download is progressing, interrupted, or complete'),
          danger: z
            .enum(['file', 'url', 'content', 'uncommon', 'host', 'unwanted', 'safe', 'accepted'])
            .optional()
            .describe('Indication of whether this download is thought to be safe or suspicious'),
          mime: z.string().optional().describe("The file's MIME type"),
          startedAfter: z
            .string()
            .optional()
            .describe(
              'Limits results to DownloadItem that started after the given time in ISO 8601 format'
            ),
          startedBefore: z
            .string()
            .optional()
            .describe(
              'Limits results to DownloadItem that started before the given time in ISO 8601 format'
            ),
          endedAfter: z
            .string()
            .optional()
            .describe(
              'Limits results to DownloadItem that ended after the given time in ISO 8601 format'
            ),
          endedBefore: z
            .string()
            .optional()
            .describe(
              'Limits results to DownloadItem that ended before the given time in ISO 8601 format'
            ),
          limit: z
            .number()
            .optional()
            .describe('The maximum number of matching DownloadItem to erase'),
        },
      },
      async (params) => {
        try {
          const query: chrome.downloads.DownloadQuery = {};

          // Map the optional parameters
          if (params.id !== undefined) query.id = params.id;
          if (params.url !== undefined) query.url = params.url;
          if (params.urlRegex !== undefined) query.urlRegex = params.urlRegex;
          if (params.filename !== undefined) query.filename = params.filename;
          if (params.filenameRegex !== undefined) query.filenameRegex = params.filenameRegex;
          if (params.state !== undefined) query.state = params.state;
          if (params.danger !== undefined) query.danger = params.danger;
          if (params.mime !== undefined) query.mime = params.mime;
          if (params.startedAfter !== undefined) query.startedAfter = params.startedAfter;
          if (params.startedBefore !== undefined) query.startedBefore = params.startedBefore;
          if (params.endedAfter !== undefined) query.endedAfter = params.endedAfter;
          if (params.endedBefore !== undefined) query.endedBefore = params.endedBefore;
          if (params.limit !== undefined) query.limit = params.limit;

          const erasedIds = await new Promise<number[]>((resolve, reject) => {
            chrome.downloads.erase(query, (erasedIds) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(erasedIds);
              }
            });
          });

          return this.formatSuccess('Downloads erased from history successfully', {
            erasedCount: erasedIds.length,
            erasedIds,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerRemoveFile(): void {
    this.server.registerTool(
      'remove_file',
      {
        description: 'Remove the downloaded file if it exists and the download is complete',
        inputSchema: {
          downloadId: z.number().describe('The identifier for the downloaded file to remove'),
        },
      },
      async ({ downloadId }) => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.downloads.removeFile(downloadId, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Downloaded file removed successfully', { downloadId });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerAcceptDanger(): void {
    this.server.registerTool(
      'accept_danger',
      {
        description: 'Prompt the user to accept a dangerous download',
        inputSchema: {
          downloadId: z.number().describe('The identifier for the DownloadItem'),
        },
      },
      async ({ downloadId }) => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.downloads.acceptDanger(downloadId, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Dangerous download accepted', { downloadId });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetUiOptions(): void {
    this.server.registerTool(
      'set_ui_options',
      {
        description:
          'Change the download UI of every window associated with the current browser profile',
        inputSchema: {
          enabled: z.boolean().describe('Enable or disable the download UI'),
        },
      },
      async ({ enabled }) => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.downloads.setUiOptions({ enabled }, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Download UI options updated successfully', { enabled });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
