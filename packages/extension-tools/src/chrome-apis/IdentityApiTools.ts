import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface IdentityApiToolsOptions {
  getAuthToken?: boolean;
  getProfileUserInfo?: boolean;
  getAccounts?: boolean;
  getRedirectURL?: boolean;
  launchWebAuthFlow?: boolean;
  removeCachedAuthToken?: boolean;
  clearAllCachedAuthTokens?: boolean;
}

export class IdentityApiTools extends BaseApiTools {
  protected apiName = 'Identity';

  constructor(
    server: McpServer,
    options: IdentityApiToolsOptions = {}
  ) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.identity) {
        return {
          available: false,
          message: 'chrome.identity API is not defined',
          details: 'This extension needs the "identity" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.identity.getRedirectURL !== 'function') {
        return {
          available: false,
          message: 'chrome.identity.getRedirectURL is not available',
          details: 'The identity API appears to be partially available. Check manifest permissions.',
        };
      }

      // Try to actually use the API
      const redirectUrl = chrome.identity.getRedirectURL();
      if (!redirectUrl) {
        throw new Error('Failed to generate redirect URL');
      }

      return {
        available: true,
        message: 'Identity API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.identity API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('getAuthToken')) {
      this.registerGetAuthToken();
    }

    if (this.shouldRegisterTool('getProfileUserInfo')) {
      this.registerGetProfileUserInfo();
    }

    if (this.shouldRegisterTool('getAccounts')) {
      this.registerGetAccounts();
    }

    if (this.shouldRegisterTool('getRedirectURL')) {
      this.registerGetRedirectURL();
    }

    if (this.shouldRegisterTool('launchWebAuthFlow')) {
      this.registerLaunchWebAuthFlow();
    }

    if (this.shouldRegisterTool('removeCachedAuthToken')) {
      this.registerRemoveCachedAuthToken();
    }

    if (this.shouldRegisterTool('clearAllCachedAuthTokens')) {
      this.registerClearAllCachedAuthTokens();
    }
  }

  private registerGetAuthToken(): void {
    this.server.registerTool(
      'get_auth_token',
      {
        description: 'Gets an OAuth2 access token using the client ID and scopes specified in manifest.json',
        inputSchema: {
          interactive: z
            .boolean()
            .optional()
            .describe('Whether to prompt the user for authorization if required'),
          scopes: z
            .array(z.string())
            .optional()
            .describe('List of OAuth2 scopes to request (overrides manifest.json scopes)'),
          accountId: z
            .string()
            .optional()
            .describe('Account ID whose token should be returned'),
          enableGranularPermissions: z
            .boolean()
            .optional()
            .describe('Enable granular permissions consent screen'),
        },
      },
      async ({ interactive, scopes, accountId, enableGranularPermissions }) => {
        try {
          const details: chrome.identity.TokenDetails = {};

          if (interactive !== undefined) {
            details.interactive = interactive;
          }

          if (scopes !== undefined) {
            details.scopes = scopes;
          }

          if (accountId !== undefined) {
            details.account = { id: accountId };
          }

          if (enableGranularPermissions !== undefined) {
            details.enableGranularPermissions = enableGranularPermissions;
          }

          const result = await new Promise<chrome.identity.GetAuthTokenResult>((resolve, reject) => {
            chrome.identity.getAuthToken(details, (result) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(result);
              }
            });
          });

          return this.formatJson({
            token: result.token,
            grantedScopes: result.grantedScopes,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetProfileUserInfo(): void {
    this.server.registerTool(
      'get_profile_user_info',
      {
        description: 'Retrieves email address and obfuscated gaia id of the user signed into a profile',
        inputSchema: {
          accountStatus: z
            .enum(['SYNC', 'ANY'])
            .optional()
            .describe('Status of the primary account (SYNC or ANY)'),
        },
      },
      async ({ accountStatus }) => {
        try {
          const details: chrome.identity.ProfileDetails = {};

          if (accountStatus !== undefined) {
            details.accountStatus = accountStatus as chrome.identity.AccountStatus;
          }

          const userInfo = await new Promise<chrome.identity.ProfileUserInfo>((resolve, reject) => {
            chrome.identity.getProfileUserInfo(details, (userInfo) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(userInfo);
              }
            });
          });

          return this.formatJson({
            id: userInfo.id,
            email: userInfo.email,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetAccounts(): void {
    this.server.registerTool(
      'get_accounts',
      {
        description: 'Retrieves a list of AccountInfo objects describing the accounts present on the profile',
        inputSchema: {},
      },
      async () => {
        try {
          const accounts = await new Promise<chrome.identity.AccountInfo[]>((resolve, reject) => {
            chrome.identity.getAccounts((accounts) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(accounts);
              }
            });
          });

          return this.formatJson({
            count: accounts.length,
            accounts: accounts.map((account) => ({
              id: account.id,
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetRedirectURL(): void {
    this.server.registerTool(
      'get_redirect_url',
      {
        description: 'Generates a redirect URL to be used in launchWebAuthFlow',
        inputSchema: {
          path: z
            .string()
            .optional()
            .describe('The path appended to the end of the generated URL'),
        },
      },
      async ({ path }) => {
        try {
          const redirectUrl = chrome.identity.getRedirectURL(path);

          return this.formatJson({
            redirectUrl: redirectUrl,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerLaunchWebAuthFlow(): void {
    this.server.registerTool(
      'launch_web_auth_flow',
      {
        description: 'Starts an auth flow at the specified URL with non-Google identity providers',
        inputSchema: {
          url: z.string().describe('The URL that initiates the auth flow'),
          interactive: z
            .boolean()
            .optional()
            .describe('Whether to launch auth flow in interactive mode'),
          abortOnLoadForNonInteractive: z
            .boolean()
            .optional()
            .describe('Whether to terminate flow for non-interactive requests after page loads'),
          timeoutMsForNonInteractive: z
            .number()
            .optional()
            .describe('Maximum time in milliseconds for non-interactive mode'),
        },
      },
      async ({ url, interactive, abortOnLoadForNonInteractive, timeoutMsForNonInteractive }) => {
        try {
          const details: chrome.identity.WebAuthFlowDetails = { url };

          if (interactive !== undefined) {
            details.interactive = interactive;
          }

          if (abortOnLoadForNonInteractive !== undefined) {
            details.abortOnLoadForNonInteractive = abortOnLoadForNonInteractive;
          }

          if (timeoutMsForNonInteractive !== undefined) {
            details.timeoutMsForNonInteractive = timeoutMsForNonInteractive;
          }

          const responseUrl = await new Promise<string | undefined>((resolve, reject) => {
            chrome.identity.launchWebAuthFlow(details, (responseUrl) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(responseUrl);
              }
            });
          });

          return this.formatJson({
            responseUrl: responseUrl,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerRemoveCachedAuthToken(): void {
    this.server.registerTool(
      'remove_cached_auth_token',
      {
        description: 'Removes an OAuth2 access token from the Identity API token cache',
        inputSchema: {
          token: z.string().describe('The specific token that should be removed from the cache'),
        },
      },
      async ({ token }) => {
        try {
          const details: chrome.identity.InvalidTokenDetails = { token };

          await new Promise<void>((resolve, reject) => {
            chrome.identity.removeCachedAuthToken(details, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Token removed from cache successfully', { token });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerClearAllCachedAuthTokens(): void {
    this.server.registerTool(
      'clear_all_cached_auth_tokens',
      {
        description: 'Resets the state of the Identity API by removing all OAuth2 tokens and user preferences',
        inputSchema: {},
      },
      async () => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.identity.clearAllCachedAuthTokens(() => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('All cached auth tokens cleared successfully');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}