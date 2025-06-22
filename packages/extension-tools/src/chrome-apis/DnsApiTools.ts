// import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// import { z } from 'zod';
// import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

// export interface DnsApiToolsOptions {
//   resolve?: boolean;
// }

// export class DnsApiTools extends BaseApiTools {
//   protected apiName = 'Dns';

//   constructor(
//     server: McpServer,
//     options: DnsApiToolsOptions = {}
//   ) {
//     super(server, options);
//   }

//   checkAvailability(): ApiAvailability {
//     try {
//       // Check if API exists
//       if (!chrome.dns) {
//         return {
//           available: false,
//           message: 'chrome.dns API is not defined',
//           details: 'This extension needs the "dns" permission in its manifest.json. Note: This API is only available in Chrome Dev channel.',
//         };
//       }

//       // Test a basic method
//       if (typeof chrome.dns.resolve !== 'function') {
//         return {
//           available: false,
//           message: 'chrome.dns.resolve is not available',
//           details: 'The dns API appears to be partially available. Check manifest permissions and ensure you are using Chrome Dev channel.',
//         };
//       }

//       return {
//         available: true,
//         message: 'DNS API is fully available',
//       };
//     } catch (error) {
//       return {
//         available: false,
//         message: 'Failed to access chrome.dns API',
//         details: error instanceof Error ? error.message : 'Unknown error occurred',
//       };
//     }
//   }

//   registerTools(): void {
//     if (this.shouldRegisterTool('resolve')) {
//       this.registerResolve();
//     }
//   }

//   private registerResolve(): void {
//     this.server.registerTool(
//       'resolve_dns',
//       {
//         description: 'Resolve a hostname or IP address literal to get its IP address',
//         inputSchema: {
//           hostname: z
//             .string()
//             .describe(
//               'The hostname to resolve. Do not include scheme (https://) or trailing slash. Example: "example.com" not "https://example.com/"'
//             ),
//         },
//       },
//       async ({ hostname }) => {
//         try {
//           // Validate hostname format
//           if (hostname.includes('://') || hostname.endsWith('/')) {
//             return this.formatError(
//               'Invalid hostname format. Do not include scheme (https://) or trailing slash. Use "example.com" not "https://example.com/"'
//             );
//           }

//           const resolveInfo = await new Promise<chrome.dns.ResolveCallbackResolveInfo>(
//             (resolve, reject) => {
//               chrome.dns.resolve(hostname, (resolveInfo) => {
//                 if (chrome.runtime.lastError) {
//                   reject(new Error(chrome.runtime.lastError.message));
//                 } else {
//                   resolve(resolveInfo);
//                 }
//               });
//             }
//           );

//           if (resolveInfo.resultCode === 0) {
//             return this.formatJson({
//               hostname: hostname,
//               address: resolveInfo.address,
//               resultCode: resolveInfo.resultCode,
//               success: true,
//             });
//           } else {
//             return this.formatJson({
//               hostname: hostname,
//               address: null,
//               resultCode: resolveInfo.resultCode,
//               success: false,
//               error: `DNS resolution failed with result code: ${resolveInfo.resultCode}`,
//             });
//           }
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }
// }
