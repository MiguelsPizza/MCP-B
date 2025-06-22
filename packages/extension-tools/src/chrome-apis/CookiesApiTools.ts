import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface CookiesApiToolsOptions {
  getCookie?: boolean;
  getAllCookies?: boolean;
  getAllCookieStores?: boolean;
  getPartitionKey?: boolean;
  setCookie?: boolean;
  removeCookie?: boolean;
}

export class CookiesApiTools extends BaseApiTools {
  protected apiName = 'Cookies';

  constructor(server: McpServer, options: CookiesApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.cookies) {
        return {
          available: false,
          message: 'chrome.cookies API is not defined',
          details:
            'This extension needs the "cookies" permission and appropriate host permissions in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.cookies.getAllCookieStores !== 'function') {
        return {
          available: false,
          message: 'chrome.cookies.getAllCookieStores is not available',
          details: 'The cookies API appears to be partially available. Check manifest permissions.',
        };
      }

      // Try to actually use the API
      chrome.cookies.getAllCookieStores((_stores) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'Cookies API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.cookies API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('getCookie')) {
      this.registerGetCookie();
    }

    if (this.shouldRegisterTool('getAllCookies')) {
      this.registerGetAllCookies();
    }

    if (this.shouldRegisterTool('getAllCookieStores')) {
      this.registerGetAllCookieStores();
    }

    if (this.shouldRegisterTool('getPartitionKey')) {
      this.registerGetPartitionKey();
    }

    if (this.shouldRegisterTool('setCookie')) {
      this.registerSetCookie();
    }

    if (this.shouldRegisterTool('removeCookie')) {
      this.registerRemoveCookie();
    }
  }

  private registerGetCookie(): void {
    this.server.registerTool(
      'get_cookie',
      {
        description: 'Retrieve information about a single cookie by name and URL',
        inputSchema: {
          url: z.string().describe('The URL with which the cookie is associated'),
          name: z.string().describe('The name of the cookie to retrieve'),
          storeId: z.string().optional().describe('The ID of the cookie store to search in'),
          partitionKey: z
            .object({
              topLevelSite: z.string().optional(),
              hasCrossSiteAncestor: z.boolean().optional(),
            })
            .optional()
            .describe('The partition key for partitioned cookies'),
        },
      },
      async ({ url, name, storeId, partitionKey }) => {
        try {
          const details: chrome.cookies.CookieDetails = {
            url,
            name,
          };

          if (storeId !== undefined) {
            details.storeId = storeId;
          }

          if (partitionKey !== undefined) {
            details.partitionKey = partitionKey;
          }

          const cookie = await new Promise<chrome.cookies.Cookie | undefined>((resolve, reject) => {
            chrome.cookies.get(details, (cookie) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(cookie ?? undefined);
              }
            });
          });

          if (!cookie) {
            return this.formatSuccess('No cookie found', { name, url });
          }

          return this.formatJson({
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path,
            secure: cookie.secure,
            httpOnly: cookie.httpOnly,
            sameSite: cookie.sameSite,
            session: cookie.session,
            expirationDate: cookie.expirationDate,
            hostOnly: cookie.hostOnly,
            storeId: cookie.storeId,
            partitionKey: cookie.partitionKey,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetAllCookies(): void {
    this.server.registerTool(
      'get_all_cookies',
      {
        description: 'Retrieve all cookies that match the given criteria',
        inputSchema: {
          url: z
            .string()
            .optional()
            .describe('Restricts cookies to those that would match the given URL'),
          domain: z
            .string()
            .optional()
            .describe(
              'Restricts cookies to those whose domains match or are subdomains of this one'
            ),
          name: z.string().optional().describe('Filters the cookies by name'),
          path: z
            .string()
            .optional()
            .describe('Restricts cookies to those whose path exactly matches this string'),
          secure: z.boolean().optional().describe('Filters cookies by their Secure property'),
          session: z.boolean().optional().describe('Filters out session vs. persistent cookies'),
          storeId: z.string().optional().describe('The cookie store to retrieve cookies from'),
          partitionKey: z
            .object({
              topLevelSite: z.string().optional(),
              hasCrossSiteAncestor: z.boolean().optional(),
            })
            .optional()
            .describe('The partition key for partitioned cookies'),
        },
      },
      async ({ url, domain, name, path, secure, session, storeId, partitionKey }) => {
        try {
          const details: any = {};

          if (url !== undefined) details.url = url;
          if (domain !== undefined) details.domain = domain;
          if (name !== undefined) details.name = name;
          if (path !== undefined) details.path = path;
          if (secure !== undefined) details.secure = secure;
          if (session !== undefined) details.session = session;
          if (storeId !== undefined) details.storeId = storeId;
          if (partitionKey !== undefined) details.partitionKey = partitionKey;

          const cookies = await new Promise<chrome.cookies.Cookie[]>((resolve, reject) => {
            chrome.cookies.getAll(details, (cookies) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(cookies);
              }
            });
          });

          return this.formatJson({
            count: cookies.length,
            cookies: cookies.map((cookie) => ({
              name: cookie.name,
              value: cookie.value,
              domain: cookie.domain,
              path: cookie.path,
              secure: cookie.secure,
              httpOnly: cookie.httpOnly,
              sameSite: cookie.sameSite,
              session: cookie.session,
              expirationDate: cookie.expirationDate,
              hostOnly: cookie.hostOnly,
              storeId: cookie.storeId,
              partitionKey: cookie.partitionKey,
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetAllCookieStores(): void {
    this.server.registerTool(
      'get_all_cookie_stores',
      {
        description: 'List all existing cookie stores',
        inputSchema: {},
      },
      async () => {
        try {
          const cookieStores = await new Promise<chrome.cookies.CookieStore[]>(
            (resolve, reject) => {
              chrome.cookies.getAllCookieStores((cookieStores) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(cookieStores);
                }
              });
            }
          );

          return this.formatJson({
            count: cookieStores.length,
            cookieStores: cookieStores.map((store) => ({
              id: store.id,
              tabIds: store.tabIds,
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetPartitionKey(): void {
    this.server.registerTool(
      'get_partition_key',
      {
        description: 'Get the partition key for a specific frame',
        inputSchema: {
          tabId: z
            .number()
            .optional()
            .describe('The unique identifier for the tab containing the frame'),
          frameId: z
            .number()
            .optional()
            .describe('The unique identifier for the frame within the tab'),
          documentId: z.string().optional().describe('The unique identifier for the document'),
        },
      },
      async ({ tabId, frameId, documentId }) => {
        try {
          const details: chrome.cookies.FrameDetails = {};

          if (tabId !== undefined) details.tabId = tabId;
          if (frameId !== undefined) details.frameId = frameId;
          if (documentId !== undefined) details.documentId = documentId;

          const result = await new Promise<{ partitionKey: chrome.cookies.CookiePartitionKey }>(
            (resolve, reject) => {
              chrome.cookies.getPartitionKey(details, (result) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(result);
                }
              });
            }
          );

          return this.formatJson({
            partitionKey: result.partitionKey,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetCookie(): void {
    this.server.registerTool(
      'set_cookie',
      {
        description:
          'Set a cookie with the given data; may overwrite equivalent cookies if they exist',
        inputSchema: {
          url: z.string().describe('The request-URI to associate with the setting of the cookie'),
          name: z
            .string()
            .optional()
            .describe('The name of the cookie. Empty by default if omitted'),
          value: z
            .string()
            .optional()
            .describe('The value of the cookie. Empty by default if omitted'),
          domain: z
            .string()
            .optional()
            .describe(
              'The domain of the cookie. If omitted, the cookie becomes a host-only cookie'
            ),
          path: z
            .string()
            .optional()
            .describe('The path of the cookie. Defaults to the path portion of the url parameter'),
          secure: z
            .boolean()
            .optional()
            .describe('Whether the cookie should be marked as Secure. Defaults to false'),
          httpOnly: z
            .boolean()
            .optional()
            .describe('Whether the cookie should be marked as HttpOnly. Defaults to false'),
          sameSite: z
            .enum(['no_restriction', 'lax', 'strict', 'unspecified'])
            .optional()
            .describe("The cookie's same-site status"),
          expirationDate: z
            .number()
            .optional()
            .describe(
              'The expiration date of the cookie as the number of seconds since the UNIX epoch'
            ),
          storeId: z
            .string()
            .optional()
            .describe('The ID of the cookie store in which to set the cookie'),
          partitionKey: z
            .object({
              topLevelSite: z.string().optional(),
              hasCrossSiteAncestor: z.boolean().optional(),
            })
            .optional()
            .describe('The partition key for partitioned cookies'),
        },
      },
      async ({
        url,
        name,
        value,
        domain,
        path,
        secure,
        httpOnly,
        sameSite,
        expirationDate,
        storeId,
        partitionKey,
      }) => {
        try {
          const details: any = { url };

          if (name !== undefined) details.name = name;
          if (value !== undefined) details.value = value;
          if (domain !== undefined) details.domain = domain;
          if (path !== undefined) details.path = path;
          if (secure !== undefined) details.secure = secure;
          if (httpOnly !== undefined) details.httpOnly = httpOnly;
          if (sameSite !== undefined) details.sameSite = sameSite;
          if (expirationDate !== undefined) details.expirationDate = expirationDate;
          if (storeId !== undefined) details.storeId = storeId;
          if (partitionKey !== undefined) details.partitionKey = partitionKey;

          const cookie = await new Promise<chrome.cookies.Cookie | undefined>((resolve, reject) => {
            chrome.cookies.set(details, (cookie) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(cookie ?? undefined);
              }
            });
          });

          if (!cookie) {
            return this.formatError('Failed to set cookie');
          }

          return this.formatSuccess('Cookie set successfully', {
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path,
            secure: cookie.secure,
            httpOnly: cookie.httpOnly,
            sameSite: cookie.sameSite,
            session: cookie.session,
            expirationDate: cookie.expirationDate,
            hostOnly: cookie.hostOnly,
            storeId: cookie.storeId,
            partitionKey: cookie.partitionKey,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerRemoveCookie(): void {
    this.server.registerTool(
      'remove_cookie',
      {
        description: 'Delete a cookie by name',
        inputSchema: {
          url: z.string().describe('The URL with which the cookie to remove is associated'),
          name: z.string().describe('The name of the cookie to remove'),
          storeId: z.string().optional().describe('The ID of the cookie store to look in'),
          partitionKey: z
            .object({
              topLevelSite: z.string().optional(),
              hasCrossSiteAncestor: z.boolean().optional(),
            })
            .optional()
            .describe('The partition key for partitioned cookies'),
        },
      },
      async ({ url, name, storeId, partitionKey }) => {
        try {
          const details: chrome.cookies.CookieDetails = {
            url,
            name,
          };

          if (storeId !== undefined) {
            details.storeId = storeId;
          }

          if (partitionKey !== undefined) {
            details.partitionKey = partitionKey;
          }

          const result = await new Promise<any>((resolve, reject) => {
            chrome.cookies.remove(details, (result) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(result);
              }
            });
          });

          if (!result) {
            return this.formatSuccess('No cookie found to remove', { name, url });
          }

          return this.formatSuccess('Cookie removed successfully', {
            name: result.name,
            url: result.url,
            storeId: result.storeId,
            partitionKey: result.partitionKey,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
