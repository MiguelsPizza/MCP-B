// import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// import { z } from 'zod';
// import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

// export interface DevtoolsPerformanceApiToolsOptions {
//   getProfile?: boolean;
//   startProfiling?: boolean;
//   stopProfiling?: boolean;
// }

// export class DevtoolsPerformanceApiTools extends BaseApiTools {
//   protected apiName = 'Devtools.performance';

//   constructor(
//     server: McpServer,
//     options: DevtoolsPerformanceApiToolsOptions = {}
//   ) {
//     super(server, options);
//   }

//   checkAvailability(): ApiAvailability {
//     try {
//       // Check if API exists
//       if (!chrome.devtools || !chrome.devtools.performance) {
//         return {
//           available: false,
//           message: 'chrome.devtools.performance API is not defined',
//           details: 'This extension needs to be running in a devtools context and have the "devtools" permission in its manifest.json',
//         };
//       }

//       // Test a basic method
//       if (typeof chrome.devtools.performance.getProfile !== 'function') {
//         return {
//           available: false,
//           message: 'chrome.devtools.performance.getProfile is not available',
//           details: 'The devtools.performance API appears to be partially available. Check manifest permissions and devtools context.',
//         };
//       }

//       return {
//         available: true,
//         message: 'Devtools.performance API is fully available',
//       };
//     } catch (error) {
//       return {
//         available: false,
//         message: 'Failed to access chrome.devtools.performance API',
//         details: error instanceof Error ? error.message : 'Unknown error occurred',
//       };
//     }
//   }

//   registerTools(): void {
//     if (this.shouldRegisterTool('getProfile')) {
//       this.registerGetProfile();
//     }

//     if (this.shouldRegisterTool('startProfiling')) {
//       this.registerStartProfiling();
//     }

//     if (this.shouldRegisterTool('stopProfiling')) {
//       this.registerStopProfiling();
//     }
//   }

//   private registerGetProfile(): void {
//     this.server.registerTool(
//       'get_profile',
//       {
//         description: 'Get the current performance profile data from the devtools',
//         inputSchema: {},
//       },
//       async () => {
//         try {
//           const profile = await new Promise<any>((resolve, reject) => {
//             chrome.devtools.performance.getProfile((profile) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(profile);
//               }
//             });
//           });

//           if (!profile) {
//             return this.formatSuccess('No performance profile available', {
//               message: 'No profiling session is currently active or no data has been collected'
//             });
//           }

//           return this.formatJson({
//             profile: profile,
//             timestamp: Date.now(),
//             message: 'Performance profile retrieved successfully'
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerStartProfiling(): void {
//     this.server.registerTool(
//       'start_profiling',
//       {
//         description: 'Start performance profiling in the devtools',
//         inputSchema: {
//           categories: z
//             .array(z.string())
//             .optional()
//             .describe('Array of performance categories to profile (e.g., ["blink.console", "devtools.timeline"])'),
//         },
//       },
//       async ({ categories }) => {
//         try {
//           await new Promise<void>((resolve, reject) => {
//             if (categories && categories.length > 0) {
//               chrome.devtools.performance.startProfiling(categories, () => {
//                 if (chrome.runtime.lastError) {
//                   reject(new Error(chrome.runtime.lastError.message));
//                 } else {
//                   resolve();
//                 }
//               });
//             } else {
//               chrome.devtools.performance.startProfiling(() => {
//                 if (chrome.runtime.lastError) {
//                   reject(new Error(chrome.runtime.lastError.message));
//                 } else {
//                   resolve();
//                 }
//               });
//             }
//           });

//           return this.formatSuccess('Performance profiling started successfully', {
//             categories: categories || ['default'],
//             startTime: Date.now(),
//             message: 'Profiling session is now active'
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerStopProfiling(): void {
//     this.server.registerTool(
//       'stop_profiling',
//       {
//         description: 'Stop performance profiling and retrieve the collected data',
//         inputSchema: {},
//       },
//       async () => {
//         try {
//           const profile = await new Promise<any>((resolve, reject) => {
//             chrome.devtools.performance.stopProfiling((profile) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(profile);
//               }
//             });
//           });

//           if (!profile) {
//             return this.formatSuccess('Profiling stopped but no data collected', {
//               message: 'No profiling session was active or no performance data was captured'
//             });
//           }

//           return this.formatJson({
//             profile: profile,
//             stopTime: Date.now(),
//             message: 'Performance profiling stopped and data collected successfully'
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }
// }
