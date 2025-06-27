import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface EnterprisePlatformKeysApiToolsOptions {
  getTokens?: boolean;
  getCertificates?: boolean;
  importCertificate?: boolean;
  removeCertificate?: boolean;
  challengeMachineKey?: boolean;
  challengeUserKey?: boolean;
}

export class EnterprisePlatformKeysApiTools extends BaseApiTools {
  protected apiName = 'Enterprise.platformKeys';

  constructor(server: McpServer, options: EnterprisePlatformKeysApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.enterprise || !chrome.enterprise.platformKeys) {
        return {
          available: false,
          message: 'chrome.enterprise.platformKeys API is not defined',
          details:
            'This extension needs the "enterprise.platformKeys" permission in its manifest.json and must be running on ChromeOS',
        };
      }

      // Test a basic method
      if (typeof chrome.enterprise.platformKeys.getTokens !== 'function') {
        return {
          available: false,
          message: 'chrome.enterprise.platformKeys.getTokens is not available',
          details:
            'The enterprise.platformKeys API appears to be partially available. Check manifest permissions and ChromeOS platform.',
        };
      }

      // Try to actually use the API
      chrome.enterprise.platformKeys.getTokens((_tokens) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'Enterprise.platformKeys API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.enterprise.platformKeys API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('getTokens')) {
      this.registerGetTokens();
    }

    if (this.shouldRegisterTool('getCertificates')) {
      this.registerGetCertificates();
    }

    if (this.shouldRegisterTool('importCertificate')) {
      this.registerImportCertificate();
    }

    if (this.shouldRegisterTool('removeCertificate')) {
      this.registerRemoveCertificate();
    }

    if (this.shouldRegisterTool('challengeMachineKey')) {
      this.registerChallengeMachineKey();
    }

    if (this.shouldRegisterTool('challengeUserKey')) {
      this.registerChallengeUserKey();
    }
  }

  private registerGetTokens(): void {
    this.server.registerTool(
      'extension_tool_get_tokens',
      {
        description: 'Get the available platform keys tokens',
        inputSchema: {},
      },
      async () => {
        try {
          const tokens = await new Promise<chrome.enterprise.platformKeys.Token[]>(
            (resolve, reject) => {
              chrome.enterprise.platformKeys.getTokens((tokens) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(tokens);
                }
              });
            }
          );

          return this.formatJson({
            count: tokens.length,
            tokens: tokens.map((token) => ({
              id: token.id,
              subtleCrypto: !!token.subtleCrypto,
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetCertificates(): void {
    this.server.registerTool(
      'extension_tool_get_certificates',
      {
        description: 'Get certificates from a platform keys token',
        inputSchema: {
          tokenId: z.string().describe('The ID of the token to get certificates from'),
        },
      },
      async ({ tokenId }) => {
        try {
          const tokens = await new Promise<chrome.enterprise.platformKeys.Token[]>(
            (resolve, reject) => {
              chrome.enterprise.platformKeys.getTokens((tokens) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(tokens);
                }
              });
            }
          );

          const token = tokens.find((t) => t.id === tokenId);
          if (!token) {
            return this.formatError(`Token with ID '${tokenId}' not found`);
          }

          const certificates = await new Promise<ArrayBuffer[]>((resolve, reject) => {
            chrome.enterprise.platformKeys.getCertificates(tokenId, (certificates) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(certificates);
              }
            });
          });

          return this.formatJson({
            tokenId,
            count: certificates.length,
            certificates: certificates.map((cert, index) => ({
              index,
              size: cert.byteLength,
              type: 'ArrayBuffer',
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerImportCertificate(): void {
    this.server.registerTool(
      'extension_tool_import_certificate',
      {
        description: 'Import a certificate to a platform keys token',
        inputSchema: {
          tokenId: z.string().describe('The ID of the token to import the certificate to'),
          certificate: z.string().describe('The certificate data as a base64 encoded string'),
        },
      },
      async ({ tokenId, certificate }) => {
        try {
          // Convert base64 string to ArrayBuffer
          const binaryString = atob(certificate);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const certificateBuffer = bytes.buffer;

          await new Promise<void>((resolve, reject) => {
            chrome.enterprise.platformKeys.importCertificate(tokenId, certificateBuffer, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Certificate imported successfully', {
            tokenId,
            certificateSize: certificateBuffer.byteLength,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerRemoveCertificate(): void {
    this.server.registerTool(
      'extension_tool_remove_certificate',
      {
        description: 'Remove a certificate from a platform keys token',
        inputSchema: {
          tokenId: z.string().describe('The ID of the token to remove the certificate from'),
          certificate: z.string().describe('The certificate data as a base64 encoded string'),
        },
      },
      async ({ tokenId, certificate }) => {
        try {
          // Convert base64 string to ArrayBuffer
          const binaryString = atob(certificate);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const certificateBuffer = bytes.buffer;

          await new Promise<void>((resolve, reject) => {
            chrome.enterprise.platformKeys.removeCertificate(tokenId, certificateBuffer, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Certificate removed successfully', {
            tokenId,
            certificateSize: certificateBuffer.byteLength,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerChallengeMachineKey(): void {
    this.server.registerTool(
      'extension_tool_challenge_machine_key',
      {
        description: 'Challenge the machine key for enterprise attestation',
        inputSchema: {
          challenge: z.string().describe('The challenge data as a base64 encoded string'),
          registerKey: z
            .boolean()
            .optional()
            .describe('Whether to register the key if it does not exist'),
        },
      },
      async ({ challenge, registerKey }) => {
        try {
          // Convert base64 string to ArrayBuffer
          const binaryString = atob(challenge);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const challengeBuffer = bytes.buffer;

          const response = await new Promise<ArrayBuffer>((resolve, reject) => {
            if (registerKey !== undefined) {
              chrome.enterprise.platformKeys.challengeMachineKey(
                challengeBuffer,
                registerKey,
                (response) => {
                  if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                  } else {
                    resolve(response);
                  }
                }
              );
            } else {
              chrome.enterprise.platformKeys.challengeMachineKey(challengeBuffer, (response) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(response);
                }
              });
            }
          });

          // Convert response to base64
          const responseBytes = new Uint8Array(response);
          const responseBase64 = btoa(String.fromCharCode(...responseBytes));

          return this.formatJson({
            challengeSize: challengeBuffer.byteLength,
            responseSize: response.byteLength,
            response: responseBase64,
            registerKey: registerKey || false,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerChallengeUserKey(): void {
    this.server.registerTool(
      'extension_tool_challenge_user_key',
      {
        description: 'Challenge the user key for enterprise attestation',
        inputSchema: {
          challenge: z.string().describe('The challenge data as a base64 encoded string'),
          registerKey: z.boolean().describe('Whether to register the key if it does not exist'),
        },
      },
      async ({ challenge, registerKey }) => {
        try {
          // Convert base64 string to ArrayBuffer
          const binaryString = atob(challenge);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const challengeBuffer = bytes.buffer;

          const response = await new Promise<ArrayBuffer>((resolve, reject) => {
            chrome.enterprise.platformKeys.challengeUserKey(
              challengeBuffer,
              registerKey,
              (response) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(response);
                }
              }
            );
          });

          // Convert response to base64
          const responseBytes = new Uint8Array(response);
          const responseBase64 = btoa(String.fromCharCode(...responseBytes));

          return this.formatJson({
            challengeSize: challengeBuffer.byteLength,
            responseSize: response.byteLength,
            response: responseBase64,
            registerKey,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
