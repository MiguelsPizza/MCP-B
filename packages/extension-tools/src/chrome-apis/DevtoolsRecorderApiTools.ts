// import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// import { z } from 'zod';
// import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

// export interface DevtoolsRecorderApiToolsOptions {
//   createRecording?: boolean;
//   replayRecording?: boolean;
//   getRecordings?: boolean;
//   deleteRecording?: boolean;
//   exportRecording?: boolean;
//   importRecording?: boolean;
//   startRecording?: boolean;
//   stopRecording?: boolean;
//   pauseRecording?: boolean;
//   resumeRecording?: boolean;
// }

// export class DevtoolsRecorderApiTools extends BaseApiTools {
//   protected apiName = 'Devtools.recorder';

//   constructor(
//     server: McpServer,
//     options: DevtoolsRecorderApiToolsOptions = {}
//   ) {
//     super(server, options);
//   }

//   checkAvailability(): ApiAvailability {
//     try {
//       // Check if API exists
//       if (!chrome.devtools || !chrome.devtools.recorder) {
//         return {
//           available: false,
//           message: 'chrome.devtools.recorder API is not defined',
//           details: 'This extension needs to run in a devtools context and have "devtools" permission in its manifest.json',
//         };
//       }

//       // Test a basic method
//       if (typeof chrome.devtools.recorder.createView !== 'function') {
//         return {
//           available: false,
//           message: 'chrome.devtools.recorder.createRecording is not available',
//           details: 'The devtools recorder API appears to be partially available. Check manifest permissions and devtools context.',
//         };
//       }

//       return {
//         available: true,
//         message: 'Devtools Recorder API is fully available',
//       };
//     } catch (error) {
//       return {
//         available: false,
//         message: 'Failed to access chrome.devtools.recorder API',
//         details: error instanceof Error ? error.message : 'Unknown error occurred',
//       };
//     }
//   }

//   registerTools(): void {
//     if (this.shouldRegisterTool('createRecording')) {
//       this.registerCreateRecording();
//     }

//     if (this.shouldRegisterTool('replayRecording')) {
//       this.registerReplayRecording();
//     }

//     if (this.shouldRegisterTool('getRecordings')) {
//       this.registerGetRecordings();
//     }

//     if (this.shouldRegisterTool('deleteRecording')) {
//       this.registerDeleteRecording();
//     }

//     if (this.shouldRegisterTool('exportRecording')) {
//       this.registerExportRecording();
//     }

//     if (this.shouldRegisterTool('importRecording')) {
//       this.registerImportRecording();
//     }

//     if (this.shouldRegisterTool('startRecording')) {
//       this.registerStartRecording();
//     }

//     if (this.shouldRegisterTool('stopRecording')) {
//       this.registerStopRecording();
//     }

//     if (this.shouldRegisterTool('pauseRecording')) {
//       this.registerPauseRecording();
//     }

//     if (this.shouldRegisterTool('resumeRecording')) {
//       this.registerResumeRecording();
//     }
//   }

//   private registerCreateRecording(): void {
//     this.server.registerTool(
//       'create_recording',
//       {
//         description: 'Create a new user flow recording in Chrome DevTools',
//         inputSchema: {
//           name: z.string().describe('Name for the new recording'),
//           selectorAttribute: z
//             .string()
//             .optional()
//             .describe('Attribute to use for element selectors (e.g., data-testid)'),
//         },
//       },
//       async ({ name, selectorAttribute }) => {
//         try {
//           const options: any = { name };
//           if (selectorAttribute !== undefined) {
//             options.selectorAttribute = selectorAttribute;
//           }

//           const recording = await new Promise<any>((resolve, reject) => {
//             chrome.devtools.recorder.registerRecorderExtensionPlugin(options, (recording) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(recording);
//               }
//             });
//           });

//           return this.formatSuccess('Recording created successfully', {
//             id: recording.id,
//             name: recording.name,
//             selectorAttribute: recording.selectorAttribute,
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerReplayRecording(): void {
//     this.server.registerTool(
//       'replay_recording',
//       {
//         description: 'Replay a user flow recording',
//         inputSchema: {
//           recordingId: z.string().describe('ID of the recording to replay'),
//           speed: z
//             .number()
//             .min(0.1)
//             .max(10)
//             .optional()
//             .describe('Playback speed multiplier (0.1 to 10, default is 1)'),
//           breakOnError: z
//             .boolean()
//             .optional()
//             .describe('Whether to stop replay on first error (default is true)'),
//         },
//       },
//       async ({ recordingId, speed, breakOnError }) => {
//         try {
//           const options: any = { recordingId };
//           if (speed !== undefined) options.speed = speed;
//           if (breakOnError !== undefined) options.breakOnError = breakOnError;

//           const result = await new Promise<any>((resolve, reject) => {
//             chrome.devtools.recorder.replayRecording(options, (result) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(result);
//               }
//             });
//           });

//           return this.formatSuccess('Recording replay completed', {
//             recordingId,
//             success: result.success,
//             steps: result.steps,
//             errors: result.errors || [],
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerGetRecordings(): void {
//     this.server.registerTool(
//       'get_recordings',
//       {
//         description: 'Get all available user flow recordings',
//         inputSchema: {},
//       },
//       async () => {
//         try {
//           const recordings = await new Promise<any[]>((resolve, reject) => {
//             chrome.devtools.recorder.getRecordings((recordings) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(recordings);
//               }
//             });
//           });

//           return this.formatJson({
//             count: recordings.length,
//             recordings: recordings.map((recording) => ({
//               id: recording.id,
//               name: recording.name,
//               steps: recording.steps?.length || 0,
//               created: recording.created,
//               modified: recording.modified,
//             })),
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerDeleteRecording(): void {
//     this.server.registerTool(
//       'delete_recording',
//       {
//         description: 'Delete a user flow recording',
//         inputSchema: {
//           recordingId: z.string().describe('ID of the recording to delete'),
//         },
//       },
//       async ({ recordingId }) => {
//         try {
//           const success = await new Promise<boolean>((resolve, reject) => {
//             chrome.devtools.recorder.deleteRecording(recordingId, (success) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(success);
//               }
//             });
//           });

//           if (success) {
//             return this.formatSuccess('Recording deleted successfully', { recordingId });
//           } else {
//             return this.formatSuccess('Recording not found', { recordingId });
//           }
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerExportRecording(): void {
//     this.server.registerTool(
//       'export_recording',
//       {
//         description: 'Export a user flow recording to various formats',
//         inputSchema: {
//           recordingId: z.string().describe('ID of the recording to export'),
//           format: z
//             .enum(['json', 'puppeteer', 'playwright', 'cypress'])
//             .describe('Export format'),
//         },
//       },
//       async ({ recordingId, format }) => {
//         try {
//           const exportData = await new Promise<any>((resolve, reject) => {
//             chrome.devtools.recorder.exportRecording(recordingId, format, (data) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(data);
//               }
//             });
//           });

//           return this.formatSuccess('Recording exported successfully', {
//             recordingId,
//             format,
//             size: exportData.length,
//             data: exportData,
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerImportRecording(): void {
//     this.server.registerTool(
//       'import_recording',
//       {
//         description: 'Import a user flow recording from JSON data',
//         inputSchema: {
//           data: z.string().describe('JSON string containing the recording data'),
//           name: z.string().optional().describe('Name for the imported recording'),
//         },
//       },
//       async ({ data, name }) => {
//         try {
//           const options: any = { data };
//           if (name !== undefined) options.name = name;

//           const recording = await new Promise<any>((resolve, reject) => {
//             chrome.devtools.recorder.importRecording(options, (recording) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(recording);
//               }
//             });
//           });

//           return this.formatSuccess('Recording imported successfully', {
//             id: recording.id,
//             name: recording.name,
//             steps: recording.steps?.length || 0,
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerStartRecording(): void {
//     this.server.registerTool(
//       'start_recording',
//       {
//         description: 'Start recording a new user flow',
//         inputSchema: {
//           name: z.string().describe('Name for the new recording'),
//           selectorAttribute: z
//             .string()
//             .optional()
//             .describe('Attribute to use for element selectors'),
//         },
//       },
//       async ({ name, selectorAttribute }) => {
//         try {
//           const options: any = { name };
//           if (selectorAttribute !== undefined) {
//             options.selectorAttribute = selectorAttribute;
//           }

//           const recording = await new Promise<any>((resolve, reject) => {
//             chrome.devtools.recorder.startRecording(options, (recording) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(recording);
//               }
//             });
//           });

//           return this.formatSuccess('Recording started successfully', {
//             id: recording.id,
//             name: recording.name,
//             status: 'recording',
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerStopRecording(): void {
//     this.server.registerTool(
//       'stop_recording',
//       {
//         description: 'Stop the current recording session',
//         inputSchema: {},
//       },
//       async () => {
//         try {
//           const recording = await new Promise<any>((resolve, reject) => {
//             chrome.devtools.recorder.stopRecording((recording) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(recording);
//               }
//             });
//           });

//           return this.formatSuccess('Recording stopped successfully', {
//             id: recording.id,
//             name: recording.name,
//             steps: recording.steps?.length || 0,
//             status: 'stopped',
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerPauseRecording(): void {
//     this.server.registerTool(
//       'pause_recording',
//       {
//         description: 'Pause the current recording session',
//         inputSchema: {},
//       },
//       async () => {
//         try {
//           const success = await new Promise<boolean>((resolve, reject) => {
//             chrome.devtools.recorder.pauseRecording((success) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(success);
//               }
//             });
//           });

//           if (success) {
//             return this.formatSuccess('Recording paused successfully');
//           } else {
//             return this.formatSuccess('No active recording to pause');
//           }
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerResumeRecording(): void {
//     this.server.registerTool(
//       'resume_recording',
//       {
//         description: 'Resume a paused recording session',
//         inputSchema: {},
//       },
//       async () => {
//         try {
//           const success = await new Promise<boolean>((resolve, reject) => {
//             chrome.devtools.recorder.resumeRecording((success) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(success);
//               }
//             });
//           });

//           if (success) {
//             return this.formatSuccess('Recording resumed successfully');
//           } else {
//             return this.formatSuccess('No paused recording to resume');
//           }
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }
// }
