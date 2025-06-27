import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface PlatformKeysApiToolsOptions {
  selectClientCertificates?: boolean;
  getKeyPair?: boolean;
  getKeyPairBySpki?: boolean;
  verifyTLSServerCertificate?: boolean;
  getSubtleCrypto?: boolean;
}

export class PlatformKeysApiTools extends BaseApiTools {
  protected apiName = 'PlatformKeys';

  constructor(server: McpServer, options: PlatformKeysApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.platformKeys) {
        return {
          available: false,
          message: 'chrome.platformKeys API is not defined',
          details:
            'This extension needs the "platformKeys" permission in its manifest.json and must run on ChromeOS',
        };
      }

      // Test a basic method
      if (typeof chrome.platformKeys.selectClientCertificates !== 'function') {
        return {
          available: false,
          message: 'chrome.platformKeys.selectClientCertificates is not available',
          details:
            'The platformKeys API appears to be partially available. Check manifest permissions and ensure running on ChromeOS.',
        };
      }

      // Check if subtleCrypto is available
      if (typeof chrome.platformKeys.subtleCrypto !== 'function') {
        return {
          available: false,
          message: 'chrome.platformKeys.subtleCrypto is not available',
          details:
            'The platformKeys API appears to be partially available. Check manifest permissions.',
        };
      }

      return {
        available: true,
        message: 'PlatformKeys API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.platformKeys API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('selectClientCertificates')) {
      this.registerSelectClientCertificates();
    }

    if (this.shouldRegisterTool('getKeyPair')) {
      this.registerGetKeyPair();
    }

    if (this.shouldRegisterTool('getKeyPairBySpki')) {
      this.registerGetKeyPairBySpki();
    }

    if (this.shouldRegisterTool('verifyTLSServerCertificate')) {
      this.registerVerifyTLSServerCertificate();
    }

    if (this.shouldRegisterTool('getSubtleCrypto')) {
      this.registerGetSubtleCrypto();
    }
  }

  private registerSelectClientCertificates(): void {
    this.server.registerTool(
      'extension_tool_select_client_certificates',
      {
        description:
          'Filter and select client certificates that match the request and are available to the extension',
        inputSchema: {
          request: z
            .object({
              certificateTypes: z
                .array(z.enum(['rsaSign', 'ecdsaSign']))
                .describe('List of certificate types requested, sorted by server preference'),
              certificateAuthorities: z
                .array(z.string())
                .optional()
                .describe(
                  'List of distinguished names of certificate authorities (base64-encoded DER)'
                ),
            })
            .describe('Certificate request parameters'),
          interactive: z
            .boolean()
            .describe('If true, present filtered list to user for manual selection'),
          clientCerts: z
            .array(z.string())
            .optional()
            .describe('Optional list of certificates to operate on (base64-encoded DER)'),
        },
      },
      async ({ request, interactive, clientCerts }) => {
        try {
          // Convert base64 strings to ArrayBuffers
          const certificateAuthorities = request.certificateAuthorities?.map((ca) => {
            const binaryString = atob(ca);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes.buffer;
          });

          const clientCertsArrayBuffers = clientCerts?.map((cert) => {
            const binaryString = atob(cert);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes.buffer;
          });

          const details: chrome.platformKeys.ClientCertificateSelectDetails = {
            request: {
              certificateTypes: request.certificateTypes as any[],
              certificateAuthorities: certificateAuthorities || [],
            },
            interactive,
          };

          if (clientCertsArrayBuffers) {
            details.clientCerts = clientCertsArrayBuffers;
          }

          const matches = await new Promise<chrome.platformKeys.Match[]>((resolve, reject) => {
            chrome.platformKeys.selectClientCertificates(details, (matches) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(matches);
              }
            });
          });

          return this.formatJson({
            count: matches.length,
            certificates: matches.map((match) => ({
              certificate: btoa(String.fromCharCode(...new Uint8Array(match.certificate))),
              keyAlgorithm: match.keyAlgorithm,
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetKeyPair(): void {
    this.server.registerTool(
      'extension_tool_get_key_pair',
      {
        description: 'Get the key pair for a certificate for usage with platformKeys.subtleCrypto',
        inputSchema: {
          certificate: z
            .string()
            .describe('Base64-encoded DER certificate from selectClientCertificates'),
          parameters: z
            .object({
              name: z.string().describe('Algorithm name (RSASSA-PKCS1-v1_5 or ECDSA)'),
              hash: z
                .object({
                  name: z
                    .string()
                    .describe('Hash algorithm name (none, SHA-1, SHA-256, SHA-384, SHA-512)'),
                })
                .optional()
                .describe('Hash parameters for RSASSA-PKCS1-v1_5'),
            })
            .describe('Algorithm parameters'),
        },
      },
      async ({ certificate, parameters }) => {
        try {
          // Convert base64 to ArrayBuffer
          const binaryString = atob(certificate);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const certificateBuffer = bytes.buffer;

          const keyPair = await new Promise<{ publicKey: CryptoKey; privateKey: CryptoKey | null }>(
            (resolve, reject) => {
              chrome.platformKeys.getKeyPair(
                certificateBuffer,
                parameters,
                (publicKey, privateKey) => {
                  if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                  } else {
                    resolve({ publicKey, privateKey });
                  }
                }
              );
            }
          );

          return this.formatSuccess('Key pair retrieved successfully', {
            hasPublicKey: !!keyPair.publicKey,
            hasPrivateKey: !!keyPair.privateKey,
            algorithm: keyPair.publicKey.algorithm,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetKeyPairBySpki(): void {
    this.server.registerTool(
      'extension_tool_get_key_pair_by_spki',
      {
        description:
          'Get the key pair identified by a SubjectPublicKeyInfo for usage with platformKeys.subtleCrypto',
        inputSchema: {
          publicKeySpkiDer: z.string().describe('Base64-encoded DER X.509 SubjectPublicKeyInfo'),
          parameters: z
            .object({
              name: z.string().describe('Algorithm name (ECDSA or RSASSA-PKCS1-v1_5)'),
              hash: z
                .object({
                  name: z
                    .string()
                    .describe('Hash algorithm name (none, SHA-1, SHA-256, SHA-384, SHA-512)'),
                })
                .optional()
                .describe('Hash parameters for RSASSA-PKCS1-v1_5'),
            })
            .describe('Algorithm parameters'),
        },
      },
      async ({ publicKeySpkiDer, parameters }) => {
        try {
          // Convert base64 to ArrayBuffer
          const binaryString = atob(publicKeySpkiDer);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const spkiBuffer = bytes.buffer;

          const keyPair = await new Promise<{ publicKey: CryptoKey; privateKey: CryptoKey | null }>(
            (resolve, reject) => {
              chrome.platformKeys.getKeyPairBySpki(
                spkiBuffer,
                parameters,
                (publicKey, privateKey) => {
                  if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                  } else {
                    resolve({ publicKey, privateKey });
                  }
                }
              );
            }
          );

          return this.formatSuccess('Key pair retrieved successfully by SPKI', {
            hasPublicKey: !!keyPair.publicKey,
            hasPrivateKey: !!keyPair.privateKey,
            algorithm: keyPair.publicKey.algorithm,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerVerifyTLSServerCertificate(): void {
    this.server.registerTool(
      'extension_tool_verify_tls_server_certificate',
      {
        description:
          'Verify if a server certificate chain can be trusted for a hostname according to platform trust settings',
        inputSchema: {
          hostname: z.string().describe('Hostname of the server to verify the certificate for'),
          serverCertificateChain: z
            .array(z.string())
            .describe(
              'Array of base64-encoded DER X.509 certificates, first entry must be server certificate'
            ),
        },
      },
      async ({ hostname, serverCertificateChain }) => {
        try {
          // Convert base64 strings to ArrayBuffers
          const certificateChain = serverCertificateChain.map((cert) => {
            const binaryString = atob(cert);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes.buffer;
          });

          const details: chrome.platformKeys.ServerCertificateVerificationDetails = {
            hostname,
            serverCertificateChain: certificateChain,
          };

          const result = await new Promise<chrome.platformKeys.ServerCertificateVerificationResult>(
            (resolve, reject) => {
              chrome.platformKeys.verifyTLSServerCertificate(details, (result) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(result);
                }
              });
            }
          );

          return this.formatJson({
            hostname,
            trusted: result.trusted,
            debugErrors: result.debug_errors || [],
            certificateCount: serverCertificateChain.length,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetSubtleCrypto(): void {
    this.server.registerTool(
      'extension_tool_get_subtle_crypto',
      {
        description: 'Get information about the SubtleCrypto implementation for platform keys',
        inputSchema: {},
      },
      async () => {
        try {
          const subtleCrypto = chrome.platformKeys.subtleCrypto();

          if (!subtleCrypto) {
            return this.formatError('SubtleCrypto implementation is not available');
          }

          return this.formatSuccess('SubtleCrypto implementation is available', {
            available: true,
            methods: [
              'encrypt',
              'decrypt',
              'sign',
              'verify',
              'digest',
              'generateKey',
              'deriveKey',
              'deriveBits',
              'importKey',
              'exportKey',
              'wrapKey',
              'unwrapKey',
            ],
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
