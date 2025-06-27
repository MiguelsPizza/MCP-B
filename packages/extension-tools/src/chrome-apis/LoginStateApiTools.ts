import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface LoginStateApiToolsOptions {
  getProfileType?: boolean;
  getSessionState?: boolean;
}

export class LoginStateApiTools extends BaseApiTools {
  protected apiName = 'LoginState';

  constructor(server: McpServer, options: LoginStateApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.loginState) {
        return {
          available: false,
          message: 'chrome.loginState API is not defined',
          details:
            'This extension needs the "loginState" permission in its manifest.json and only works on ChromeOS',
        };
      }

      // Test a basic method
      if (typeof chrome.loginState.getProfileType !== 'function') {
        return {
          available: false,
          message: 'chrome.loginState.getProfileType is not available',
          details:
            'The loginState API appears to be partially available. Check manifest permissions and ensure this is running on ChromeOS.',
        };
      }

      // Try to actually use the API
      chrome.loginState.getProfileType((_profileType) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'LoginState API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.loginState API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('getProfileType')) {
      this.registerGetProfileType();
    }

    if (this.shouldRegisterTool('getSessionState')) {
      this.registerGetSessionState();
    }
  }

  private registerGetProfileType(): void {
    this.server.registerTool(
      'extension_tool_get_profile_type',
      {
        description:
          'Get the type of the profile the extension is in (signin profile or user profile)',
        inputSchema: {},
      },
      async () => {
        try {
          const profileType = await new Promise<chrome.loginState.ProfileType>(
            (resolve, reject) => {
              chrome.loginState.getProfileType((result) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(result);
                }
              });
            }
          );

          return this.formatJson({
            profileType: profileType,
            description:
              profileType === 'SIGNIN_PROFILE'
                ? 'Extension is in the signin profile'
                : 'Extension is in the user profile',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetSessionState(): void {
    this.server.registerTool(
      'extension_tool_get_session_state',
      {
        description:
          'Get the current session state (unknown, OOBE screen, login screen, in session, lock screen, or RMA screen)',
        inputSchema: {},
      },
      async () => {
        try {
          const sessionState = await new Promise<chrome.loginState.SessionState>(
            (resolve, reject) => {
              chrome.loginState.getSessionState((result) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(result);
                }
              });
            }
          );

          const getStateDescription = (state: chrome.loginState.SessionState): string => {
            switch (state) {
              case 'UNKNOWN':
                return 'Session state is unknown';
              case 'IN_OOBE_SCREEN':
                return 'User is in the out-of-box-experience screen';
              case 'IN_LOGIN_SCREEN':
                return 'User is in the login screen';
              case 'IN_SESSION':
                return 'User is in the session';
              case 'IN_LOCK_SCREEN':
                return 'User is in the lock screen';
              default:
                return 'Unknown session state';
            }
          };

          return this.formatJson({
            sessionState: sessionState,
            description: getStateDescription(sessionState),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
