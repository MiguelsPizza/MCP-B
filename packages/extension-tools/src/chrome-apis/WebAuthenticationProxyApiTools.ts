import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { type ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface WebAuthenticationProxyApiToolsOptions {
  attach?: boolean;
  detach?: boolean;
  completeCreateRequest?: boolean;
  completeGetRequest?: boolean;
  completeIsUvpaaRequest?: boolean;
  onCreateRequest?: boolean;
  onGetRequest?: boolean;
  onIsUvpaaRequest?: boolean;
  onRemoteSessionStateChange?: boolean;
  onRequestCanceled?: boolean;
}

export class WebAuthenticationProxyApiTools extends BaseApiTools {
  protected apiName = 'WebAuthenticationProxy';

  constructor(server: McpServer, options: WebAuthenticationProxyApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.webAuthenticationProxy) {
        return {
          available: false,
          message: 'chrome.webAuthenticationProxy API is not defined',
          details:
            'This extension needs the "webAuthenticationProxy" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.webAuthenticationProxy.attach !== 'function') {
        return {
          available: false,
          message: 'chrome.webAuthenticationProxy.attach is not available',
          details:
            'The webAuthenticationProxy API appears to be partially available. Check manifest permissions.',
        };
      }

      return {
        available: true,
        message: 'WebAuthenticationProxy API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.webAuthenticationProxy API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('attach')) {
      this.registerAttach();
    }

    if (this.shouldRegisterTool('detach')) {
      this.registerDetach();
    }

    if (this.shouldRegisterTool('completeCreateRequest')) {
      this.registerCompleteCreateRequest();
    }

    if (this.shouldRegisterTool('completeGetRequest')) {
      this.registerCompleteGetRequest();
    }

    if (this.shouldRegisterTool('completeIsUvpaaRequest')) {
      this.registerCompleteIsUvpaaRequest();
    }

    if (this.shouldRegisterTool('onCreateRequest')) {
      this.registerOnCreateRequest();
    }

    if (this.shouldRegisterTool('onGetRequest')) {
      this.registerOnGetRequest();
    }

    if (this.shouldRegisterTool('onIsUvpaaRequest')) {
      this.registerOnIsUvpaaRequest();
    }

    if (this.shouldRegisterTool('onRemoteSessionStateChange')) {
      this.registerOnRemoteSessionStateChange();
    }

    if (this.shouldRegisterTool('onRequestCanceled')) {
      this.registerOnRequestCanceled();
    }
  }

  private registerAttach(): void {
    this.server.registerTool(
      'extension_tool_attach_web_authentication_proxy',
      {
        description: 'Makes this extension the active Web Authentication API request proxy',
        inputSchema: {},
      },
      async () => {
        try {
          const error = await new Promise<string | undefined>((resolve, reject) => {
            chrome.webAuthenticationProxy.attach((error) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(error);
              }
            });
          });

          if (error) {
            return this.formatError(error);
          }

          return this.formatSuccess(
            'Successfully attached as Web Authentication API request proxy'
          );
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerDetach(): void {
    this.server.registerTool(
      'extension_tool_detach_web_authentication_proxy',
      {
        description:
          'Removes this extension from being the active Web Authentication API request proxy',
        inputSchema: {},
      },
      async () => {
        try {
          const error = await new Promise<string | undefined>((resolve, reject) => {
            chrome.webAuthenticationProxy.detach((error) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(error);
              }
            });
          });

          if (error) {
            return this.formatError(error);
          }

          return this.formatSuccess(
            'Successfully detached from Web Authentication API request proxy'
          );
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerCompleteCreateRequest(): void {
    this.server.registerTool(
      'extension_tool_complete_create_request',
      {
        description: 'Reports the result of a navigator.credentials.create() call',
        inputSchema: {
          requestId: z.number().describe('The requestId of the CreateRequest'),
          responseJson: z
            .string()
            .optional()
            .describe('The PublicKeyCredential serialized as JSON'),
          error: z
            .object({
              name: z.string().describe('The DOMException name'),
              message: z.string().describe('The DOMException message'),
            })
            .optional()
            .describe('The DOMException yielded by the remote request, if any'),
        },
      },
      async ({ requestId, responseJson, error }) => {
        try {
          const details: chrome.webAuthenticationProxy.CreateResponseDetails = {
            requestId,
          };

          if (responseJson !== undefined) {
            details.responseJson = responseJson;
          }

          if (error !== undefined) {
            details.error = error;
          }

          await new Promise<void>((resolve, reject) => {
            chrome.webAuthenticationProxy.completeCreateRequest(details, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Create request completed successfully', { requestId });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerCompleteGetRequest(): void {
    this.server.registerTool(
      'extension_tool_complete_get_request',
      {
        description: 'Reports the result of a navigator.credentials.get() call',
        inputSchema: {
          requestId: z.number().describe('The requestId of the GetRequest'),
          responseJson: z
            .string()
            .optional()
            .describe('The PublicKeyCredential serialized as JSON'),
          error: z
            .object({
              name: z.string().describe('The DOMException name'),
              message: z.string().describe('The DOMException message'),
            })
            .optional()
            .describe('The DOMException yielded by the remote request, if any'),
        },
      },
      async ({ requestId, responseJson, error }) => {
        try {
          const details: chrome.webAuthenticationProxy.GetResponseDetails = {
            requestId,
          };

          if (responseJson !== undefined) {
            details.responseJson = responseJson;
          }

          if (error !== undefined) {
            details.error = error;
          }

          await new Promise<void>((resolve, reject) => {
            chrome.webAuthenticationProxy.completeGetRequest(details, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Get request completed successfully', { requestId });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerCompleteIsUvpaaRequest(): void {
    this.server.registerTool(
      'extension_tool_complete_is_uvpaa_request',
      {
        description:
          'Reports the result of a PublicKeyCredential.isUserVerifyingPlatformAuthenticator() call',
        inputSchema: {
          requestId: z.number().describe('The requestId of the IsUvpaaRequest'),
          isUvpaa: z
            .boolean()
            .describe('Whether user verifying platform authenticator is available'),
        },
      },
      async ({ requestId, isUvpaa }) => {
        try {
          const details: chrome.webAuthenticationProxy.IsUvpaaResponseDetails = {
            requestId,
            isUvpaa,
          };

          await new Promise<void>((resolve, reject) => {
            chrome.webAuthenticationProxy.completeIsUvpaaRequest(details, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('IsUvpaa request completed successfully', {
            requestId,
            isUvpaa,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerOnCreateRequest(): void {
    this.server.registerTool(
      'extension_tool_listen_create_requests',
      {
        description: 'Start listening for WebAuthn navigator.credentials.create() calls',
        inputSchema: {},
      },
      async () => {
        try {
          const listener = (requestInfo: chrome.webAuthenticationProxy.CreateRequest) => {
            console.log('WebAuthn create request received:', {
              requestId: requestInfo.requestId,
              requestDetailsJson: requestInfo.requestDetailsJson,
            });
          };

          chrome.webAuthenticationProxy.onCreateRequest.addListener(listener);

          return this.formatSuccess('Started listening for WebAuthn create requests');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerOnGetRequest(): void {
    this.server.registerTool(
      'extension_tool_listen_get_requests',
      {
        description: 'Start listening for WebAuthn navigator.credentials.get() calls',
        inputSchema: {},
      },
      async () => {
        try {
          const listener = (requestInfo: chrome.webAuthenticationProxy.GetRequest) => {
            console.log('WebAuthn get request received:', {
              requestId: requestInfo.requestId,
              requestDetailsJson: requestInfo.requestDetailsJson,
            });
          };

          chrome.webAuthenticationProxy.onGetRequest.addListener(listener);

          return this.formatSuccess('Started listening for WebAuthn get requests');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerOnIsUvpaaRequest(): void {
    this.server.registerTool(
      'extension_tool_listen_is_uvpaa_requests',
      {
        description:
          'Start listening for PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable() calls',
        inputSchema: {},
      },
      async () => {
        try {
          const listener = (requestInfo: chrome.webAuthenticationProxy.IsUvpaaRequest) => {
            console.log('WebAuthn isUvpaa request received:', {
              requestId: requestInfo.requestId,
            });
          };

          chrome.webAuthenticationProxy.onIsUvpaaRequest.addListener(listener);

          return this.formatSuccess('Started listening for WebAuthn isUvpaa requests');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerOnRemoteSessionStateChange(): void {
    this.server.registerTool(
      'extension_tool_listen_remote_session_state_changes',
      {
        description: 'Start listening for remote session state changes',
        inputSchema: {},
      },
      async () => {
        try {
          const listener = () => {
            console.log('Remote session state change detected');
          };

          chrome.webAuthenticationProxy.onRemoteSessionStateChange.addListener(listener);

          return this.formatSuccess('Started listening for remote session state changes');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerOnRequestCanceled(): void {
    this.server.registerTool(
      'extension_tool_listen_request_canceled',
      {
        description: 'Start listening for canceled WebAuthn requests',
        inputSchema: {},
      },
      async () => {
        try {
          const listener = (requestId: number) => {
            console.log('WebAuthn request canceled:', { requestId });
          };

          chrome.webAuthenticationProxy.onRequestCanceled.addListener(listener);

          return this.formatSuccess('Started listening for canceled WebAuthn requests');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
