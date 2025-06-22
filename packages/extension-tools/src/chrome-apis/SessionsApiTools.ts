import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface SessionsApiToolsOptions {
  getDevices?: boolean;
  getRecentlyClosed?: boolean;
  restore?: boolean;
}

export class SessionsApiTools extends BaseApiTools {
  protected apiName = 'Sessions';

  constructor(
    server: McpServer,
    options: SessionsApiToolsOptions = {}
  ) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.sessions) {
        return {
          available: false,
          message: 'chrome.sessions API is not defined',
          details: 'This extension needs the "sessions" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.sessions.getRecentlyClosed !== 'function') {
        return {
          available: false,
          message: 'chrome.sessions.getRecentlyClosed is not available',
          details: 'The sessions API appears to be partially available. Check manifest permissions.',
        };
      }

      // Try to actually use the API
      chrome.sessions.getRecentlyClosed((_sessions) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'Sessions API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.sessions API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('getDevices')) {
      this.registerGetDevices();
    }

    if (this.shouldRegisterTool('getRecentlyClosed')) {
      this.registerGetRecentlyClosed();
    }

    if (this.shouldRegisterTool('restore')) {
      this.registerRestore();
    }
  }

  private registerGetDevices(): void {
    this.server.registerTool(
      'get_devices',
      {
        description: 'Retrieve all devices with synced sessions',
        inputSchema: {
          maxResults: z
            .number()
            .min(1)
            .max(25)
            .optional()
            .describe(
              'The maximum number of entries to be fetched. Omit to fetch the maximum number of entries (25)'
            ),
        },
      },
      async ({ maxResults }) => {
        try {
          const filter: chrome.sessions.Filter = {};
          if (maxResults !== undefined) {
            filter.maxResults = maxResults;
          }

          const devices = await new Promise<chrome.sessions.Device[]>((resolve, reject) => {
            chrome.sessions.getDevices(filter, (devices) => {
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
              deviceName: device.deviceName,
              sessionCount: device.sessions.length,
              sessions: device.sessions.map((session) => ({
                lastModified: session.lastModified,
                lastModifiedFormatted: new Date(session.lastModified * 1000).toISOString(),
                tab: session.tab ? {
                  id: session.tab.id,
                  url: session.tab.url,
                  title: session.tab.title,
                  sessionId: session.tab.sessionId,
                } : undefined,
                window: session.window ? {
                  id: session.window.id,
                  sessionId: session.window.sessionId,
                  tabCount: session.window.tabs?.length || 0,
                } : undefined,
              })),
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetRecentlyClosed(): void {
    this.server.registerTool(
      'get_recently_closed',
      {
        description: 'Get the list of recently closed tabs and/or windows',
        inputSchema: {
          maxResults: z
            .number()
            .min(1)
            .max(25)
            .optional()
            .describe(
              'The maximum number of entries to be fetched. Omit to fetch the maximum number of entries (25)'
            ),
        },
      },
      async ({ maxResults }) => {
        try {
          const filter: chrome.sessions.Filter = {};
          if (maxResults !== undefined) {
            filter.maxResults = maxResults;
          }

          const sessions = await new Promise<chrome.sessions.Session[]>((resolve, reject) => {
            chrome.sessions.getRecentlyClosed(filter, (sessions) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(sessions);
              }
            });
          });

          return this.formatJson({
            count: sessions.length,
            sessions: sessions.map((session) => ({
              lastModified: session.lastModified,
              lastModifiedFormatted: new Date(session.lastModified * 1000).toISOString(),
              tab: session.tab ? {
                id: session.tab.id,
                url: session.tab.url,
                title: session.tab.title,
                sessionId: session.tab.sessionId,
                favIconUrl: session.tab.favIconUrl,
              } : undefined,
              window: session.window ? {
                id: session.window.id,
                sessionId: session.window.sessionId,
                tabCount: session.window.tabs?.length || 0,
                incognito: session.window.incognito,
                type: session.window.type,
              } : undefined,
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerRestore(): void {
    this.server.registerTool(
      'restore_session',
      {
        description: 'Reopen a recently closed window or tab',
        inputSchema: {
          sessionId: z
            .string()
            .optional()
            .describe(
              'The sessionId of the window or tab to restore. If not specified, the most recently closed session is restored'
            ),
        },
      },
      async ({ sessionId }) => {
        try {
          const restoredSession = await new Promise<chrome.sessions.Session>((resolve, reject) => {
            if (sessionId) {
              chrome.sessions.restore(sessionId, (restoredSession) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(restoredSession);
                }
              });
            } else {
              chrome.sessions.restore((restoredSession) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(restoredSession);
                }
              });
            }
          });

          return this.formatSuccess('Session restored successfully', {
            lastModified: restoredSession.lastModified,
            lastModifiedFormatted: new Date(restoredSession.lastModified * 1000).toISOString(),
            tab: restoredSession.tab ? {
              id: restoredSession.tab.id,
              url: restoredSession.tab.url,
              title: restoredSession.tab.title,
              sessionId: restoredSession.tab.sessionId,
            } : undefined,
            window: restoredSession.window ? {
              id: restoredSession.window.id,
              sessionId: restoredSession.window.sessionId,
              tabCount: restoredSession.window.tabs?.length || 0,
              incognito: restoredSession.window.incognito,
              type: restoredSession.window.type,
            } : undefined,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}