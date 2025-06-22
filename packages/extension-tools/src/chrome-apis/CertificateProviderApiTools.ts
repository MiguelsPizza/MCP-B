import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface CertificateProviderApiToolsOptions {
  setCertificates?: boolean;
  reportSignature?: boolean;
  requestPin?: boolean;
  stopPinRequest?: boolean;
  onCertificatesUpdateRequested?: boolean;
  onSignatureRequested?: boolean;
}

export class CertificateProviderApiTools extends BaseApiTools {
  protected apiName = 'CertificateProvider';

  constructor(
    server: McpServer,
    options: CertificateProviderApiToolsOptions = {}
  ) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.certificateProvider) {
        return {
          available: false,
          message: 'chrome.certificateProvider API is not defined',
          details: 'This extension needs the "certificateProvider" permission in its manifest.json and only works on ChromeOS',
        };
      }

      // Test a basic method
      if (typeof chrome.certificateProvider.setCertificates !== 'function') {
        return {
          available: false,
          message: 'chrome.certificateProvider.setCertificates is not available',
          details: 'The certificateProvider API appears to be partially available. Check manifest permissions and ensure running on ChromeOS.',
        };
      }

      return {
        available: true,
        message: 'CertificateProvider API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.certificateProvider API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('setCertificates')) {
      this.registerSetCertificates();
    }

    if (this.shouldRegisterTool('reportSignature')) {
      this.registerReportSignature();
    }

    if (this.shouldRegisterTool('requestPin')) {
      this.registerRequestPin();
    }

    if (this.shouldRegisterTool('stopPinRequest')) {
      this.registerStopPinRequest();
    }

    if (this.shouldRegisterTool('onCertificatesUpdateRequested')) {
      this.registerOnCertificatesUpdateRequested();
    }

    if (this.shouldRegisterTool('onSignatureRequested')) {
      this.registerOnSignatureRequested();
    }
  }

  private registerSetCertificates(): void {
    this.server.registerTool(
      'set_certificates',
      {
        description: 'Sets a list of certificates to use in the browser for TLS client authentication',
        inputSchema: {
          certificatesRequestId: z
            .number()
            .optional()
            .describe('Request ID when responding to onCertificatesUpdateRequested event'),
          clientCertificates: z
            .array(
              z.object({
                certificateChain: z
                  .array(z.string())
                  .describe('Array of base64-encoded DER certificates, with client cert first'),
                supportedAlgorithms: z
                  .array(z.string())
                  .describe('Supported signature algorithms for this certificate'),
              })
            )
            .describe('List of client certificates to provide'),
          error: z
            .enum(['GENERAL_ERROR'])
            .optional()
            .describe('Error that occurred while extracting certificates'),
        },
      },
      async ({ certificatesRequestId, clientCertificates, error }) => {
        try {
          const details: chrome.certificateProvider.SetCertificatesDetails = {
            clientCertificates: clientCertificates.map((cert) => ({
              certificateChain: cert.certificateChain.map((b64) => {
                const binaryString = atob(b64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                return bytes.buffer;
              }),
              supportedAlgorithms: cert.supportedAlgorithms as chrome.certificateProvider.Algorithm[],
            })),
          };

          if (certificatesRequestId !== undefined) {
            details.certificatesRequestId = certificatesRequestId;
          }

          if (error !== undefined) {
            details.error = error;
          }

          await new Promise<void>((resolve, reject) => {
            chrome.certificateProvider.setCertificates(details, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Certificates set successfully', {
            certificateCount: clientCertificates.length,
            requestId: certificatesRequestId,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerReportSignature(): void {
    this.server.registerTool(
      'report_signature',
      {
        description: 'Reports the signature for a signing request from the browser',
        inputSchema: {
          signRequestId: z.number().describe('Request identifier from onSignatureRequested event'),
          signature: z
            .string()
            .optional()
            .describe('Base64-encoded signature data, if successfully generated'),
          error: z
            .enum(['GENERAL_ERROR'])
            .optional()
            .describe('Error that occurred while generating the signature'),
        },
      },
      async ({ signRequestId, signature, error }) => {
        try {
          const details: chrome.certificateProvider.ReportSignatureDetails = {
            signRequestId,
          };

          if (signature !== undefined) {
            const binaryString = atob(signature);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            details.signature = bytes.buffer;
          }

          if (error !== undefined) {
            details.error = error;
          }

          await new Promise<void>((resolve, reject) => {
            chrome.certificateProvider.reportSignature(details, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Signature reported successfully', {
            signRequestId,
            hasSignature: signature !== undefined,
            hasError: error !== undefined,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerRequestPin(): void {
    this.server.registerTool(
      'request_pin',
      {
        description: 'Requests PIN or PUK from the user for certificate operations',
        inputSchema: {
          signRequestId: z.number().describe('The ID from SignRequest'),
          requestType: z
            .enum(['PIN', 'PUK'])
            .optional()
            .describe('Type of code being requested (default: PIN)'),
          errorType: z
            .enum(['INVALID_PIN', 'INVALID_PUK', 'MAX_ATTEMPTS_EXCEEDED', 'UNKNOWN_ERROR'])
            .optional()
            .describe('Error from previous request to show to user'),
          attemptsLeft: z
            .number()
            .optional()
            .describe('Number of attempts remaining for user information'),
        },
      },
      async ({ signRequestId, requestType, errorType, attemptsLeft }) => {
        try {
          const details: chrome.certificateProvider.RequestPinDetails = {
            signRequestId,
          };

          if (requestType !== undefined) {
            details.requestType = requestType;
          }

          if (errorType !== undefined) {
            details.errorType = errorType;
          }

          if (attemptsLeft !== undefined) {
            details.attemptsLeft = attemptsLeft;
          }

          const response = await new Promise<chrome.certificateProvider.PinResponseDetails | undefined>(
            (resolve, reject) => {
              chrome.certificateProvider.requestPin(details, (response) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(response);
                }
              });
            }
          );

          return this.formatJson({
            signRequestId,
            userInput: response?.userInput || null,
            success: !!response?.userInput,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerStopPinRequest(): void {
    this.server.registerTool(
      'stop_pin_request',
      {
        description: 'Stops an ongoing PIN request flow',
        inputSchema: {
          signRequestId: z.number().describe('The ID from SignRequest'),
          errorType: z
            .enum(['INVALID_PIN', 'INVALID_PUK', 'MAX_ATTEMPTS_EXCEEDED', 'UNKNOWN_ERROR'])
            .optional()
            .describe('Error reason for stopping the flow'),
        },
      },
      async ({ signRequestId, errorType }) => {
        try {
          const details: chrome.certificateProvider.StopPinRequestDetails = {
            signRequestId,
          };

          if (errorType !== undefined) {
            details.errorType = errorType;
          }

          await new Promise<void>((resolve, reject) => {
            chrome.certificateProvider.stopPinRequest(details, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('PIN request stopped successfully', {
            signRequestId,
            errorType,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerOnCertificatesUpdateRequested(): void {
    this.server.registerTool(
      'listen_certificates_update_requested',
      {
        description: 'Sets up listener for certificate update requests from the browser',
        inputSchema: {},
      },
      async () => {
        try {
          // Remove any existing listeners to avoid duplicates
          if (chrome.certificateProvider.onCertificatesUpdateRequested.hasListeners()) {
            chrome.certificateProvider.onCertificatesUpdateRequested.removeListener(
              this.handleCertificatesUpdateRequested
            );
          }

          // Add the listener
          chrome.certificateProvider.onCertificatesUpdateRequested.addListener(
            this.handleCertificatesUpdateRequested
          );

          return this.formatSuccess('Certificate update request listener registered', {
            event: 'onCertificatesUpdateRequested',
            hasListeners: chrome.certificateProvider.onCertificatesUpdateRequested.hasListeners(),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerOnSignatureRequested(): void {
    this.server.registerTool(
      'listen_signature_requested',
      {
        description: 'Sets up listener for signature requests from the browser',
        inputSchema: {},
      },
      async () => {
        try {
          // Remove any existing listeners to avoid duplicates
          if (chrome.certificateProvider.onSignatureRequested.hasListeners()) {
            chrome.certificateProvider.onSignatureRequested.removeListener(
              this.handleSignatureRequested
            );
          }

          // Add the listener
          chrome.certificateProvider.onSignatureRequested.addListener(
            this.handleSignatureRequested
          );

          return this.formatSuccess('Signature request listener registered', {
            event: 'onSignatureRequested',
            hasListeners: chrome.certificateProvider.onSignatureRequested.hasListeners(),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private handleCertificatesUpdateRequested = (
    request: chrome.certificateProvider.CertificatesUpdateRequest
  ) => {
    console.log('Certificate update requested:', {
      certificatesRequestId: request.certificatesRequestId,
      timestamp: new Date().toISOString(),
    });
  };

  private handleSignatureRequested = (request: chrome.certificateProvider.SignatureRequest) => {
    const certificate = new Uint8Array(request.certificate);
    const input = new Uint8Array(request.input);
    
    console.log('Signature requested:', {
      signRequestId: request.signRequestId,
      algorithm: request.algorithm,
      certificateLength: certificate.length,
      inputLength: input.length,
      timestamp: new Date().toISOString(),
    });
  };
}