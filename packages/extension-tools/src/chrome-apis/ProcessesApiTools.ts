// import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// import { z } from 'zod';
// import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

// export interface ProcessesApiToolsOptions {
//   getProcessIdForTab?: boolean;
//   getProcessInfo?: boolean;
//   terminate?: boolean;
//   onCreated?: boolean;
//   onExited?: boolean;
//   onUnresponsive?: boolean;
//   onUpdated?: boolean;
//   onUpdatedWithMemory?: boolean;
// }

// export class ProcessesApiTools extends BaseApiTools {
//   protected apiName = 'Processes';

//   constructor(
//     server: McpServer,
//     options: ProcessesApiToolsOptions = {}
//   ) {
//     super(server, options);
//   }

//   checkAvailability(): ApiAvailability {
//     try {
//       // Check if API exists
//       if (!chrome.processes) {
//         return {
//           available: false,
//           message: 'chrome.processes API is not defined',
//           details: 'This extension needs the "processes" permission in its manifest.json',
//         };
//       }

//       // Test a basic method
//       if (typeof chrome.processes.getProcessInfo !== 'function') {
//         return {
//           available: false,
//           message: 'chrome.processes.getProcessInfo is not available',
//           details: 'The processes API appears to be partially available. Check manifest permissions.',
//         };
//       }

//       // Try to actually use the API
//       chrome.processes.getProcessInfo([], false, (_processes) => {
//         if (chrome.runtime.lastError) {
//           throw new Error(chrome.runtime.lastError.message);
//         }
//       });

//       return {
//         available: true,
//         message: 'Processes API is fully available',
//       };
//     } catch (error) {
//       return {
//         available: false,
//         message: 'Failed to access chrome.processes API',
//         details: error instanceof Error ? error.message : 'Unknown error occurred',
//       };
//     }
//   }

//   registerTools(): void {
//     if (this.shouldRegisterTool('getProcessIdForTab')) {
//       this.registerGetProcessIdForTab();
//     }

//     if (this.shouldRegisterTool('getProcessInfo')) {
//       this.registerGetProcessInfo();
//     }

//     if (this.shouldRegisterTool('terminate')) {
//       this.registerTerminate();
//     }

//     if (this.shouldRegisterTool('onCreated')) {
//       this.registerOnCreated();
//     }

//     if (this.shouldRegisterTool('onExited')) {
//       this.registerOnExited();
//     }

//     if (this.shouldRegisterTool('onUnresponsive')) {
//       this.registerOnUnresponsive();
//     }

//     if (this.shouldRegisterTool('onUpdated')) {
//       this.registerOnUpdated();
//     }

//     if (this.shouldRegisterTool('onUpdatedWithMemory')) {
//       this.registerOnUpdatedWithMemory();
//     }
//   }

//   private registerGetProcessIdForTab(): void {
//     this.server.registerTool(
//       'get_process_id_for_tab',
//       {
//         description: 'Get the ID of the renderer process for the specified tab',
//         inputSchema: {
//           tabId: z.number().describe('The ID of the tab for which the renderer process ID is to be returned'),
//         },
//       },
//       async ({ tabId }) => {
//         try {
//           const processId = await new Promise<number>((resolve, reject) => {
//             chrome.processes.getProcessIdForTab(tabId, (processId) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(processId);
//               }
//             });
//           });

//           return this.formatJson({
//             tabId,
//             processId,
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerGetProcessInfo(): void {
//     this.server.registerTool(
//       'get_process_info',
//       {
//         description: 'Retrieve process information for specified process IDs',
//         inputSchema: {
//           processIds: z
//             .union([z.number(), z.array(z.number())])
//             .optional()
//             .describe('The list of process IDs or single process ID. Empty array or undefined indicates all processes are requested'),
//           includeMemory: z
//             .boolean()
//             .default(false)
//             .describe('True if detailed memory usage is required. Note: collecting memory usage incurs extra CPU usage'),
//         },
//       },
//       async ({ processIds, includeMemory }) => {
//         try {
//           const processes = await new Promise<Record<string, chrome.processes.Process>>((resolve, reject) => {
//             const ids = processIds || [];
//             // chrome.processes.getProcessInfo(ids, includeMemory, (processes) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(processes);
//               }
//             });
//           });

//           const processArray = Object.entries(processes).map(([id, process]) => ({
//             id: parseInt(id),
//             osProcessId: process.osProcessId,
//             type: process.type,
//             profile: process.profile,
//             naclDebugPort: process.naclDebugPort,
//             tasks: process.tasks?.map(task => ({
//               title: task.title,
//               tabId: task.tabId,
//             })),
//             cpu: process.cpu,
//             network: process.network,
//             jsMemoryAllocated: process.jsMemoryAllocated,
//             jsMemoryUsed: process.jsMemoryUsed,
//             sqliteMemory: process.sqliteMemory,
//             privateMemory: process.privateMemory,
//             cssCache: process.cssCache ? {
//               size: process.cssCache.size,
//               liveSize: process.cssCache.liveSize,
//             } : undefined,
//             imageCache: process.imageCache ? {
//               size: process.imageCache.size,
//               liveSize: process.imageCache.liveSize,
//             } : undefined,
//             scriptCache: process.scriptCache ? {
//               size: process.scriptCache.size,
//               liveSize: process.scriptCache.liveSize,
//             } : undefined,
//           }));

//           return this.formatJson({
//             count: processArray.length,
//             includeMemory,
//             processes: processArray,
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerTerminate(): void {
//     this.server.registerTool(
//       'terminate_process',
//       {
//         description: 'Terminate the specified renderer process. Equivalent to visiting about:crash, but without changing the tab\'s URL',
//         inputSchema: {
//           processId: z.number().describe('The ID of the process to be terminated'),
//         },
//       },
//       async ({ processId }) => {
//         try {
//           const didTerminate = await new Promise<boolean>((resolve, reject) => {
//             chrome.processes.terminate(processId, (didTerminate) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(didTerminate);
//               }
//             });
//           });

//           if (didTerminate) {
//             return this.formatSuccess('Process terminated successfully', { processId });
//           } else {
//             return this.formatSuccess('Failed to terminate process', { processId, didTerminate });
//           }
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerOnCreated(): void {
//     this.server.registerTool(
//       'listen_process_created',
//       {
//         description: 'Start listening for process creation events',
//         inputSchema: {},
//       },
//       async () => {
//         try {
//           const listener = (process: chrome.processes.Process) => {
//             console.log('Process created:', {
//               id: process.id,
//               osProcessId: process.osProcessId,
//               type: process.type,
//               profile: process.profile,
//             });
//           };

//           chrome.processes.onCreated.addListener(listener);

//           return this.formatSuccess('Started listening for process creation events', {
//             event: 'onCreated',
//             status: 'listening',
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerOnExited(): void {
//     this.server.registerTool(
//       'listen_process_exited',
//       {
//         description: 'Start listening for process exit events',
//         inputSchema: {},
//       },
//       async () => {
//         try {
//           const listener = (processId: number, exitType: number, exitCode: number) => {
//             console.log('Process exited:', {
//               processId,
//               exitType,
//               exitCode,
//             });
//           };

//           chrome.processes.onExited.addListener(listener);

//           return this.formatSuccess('Started listening for process exit events', {
//             event: 'onExited',
//             status: 'listening',
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerOnUnresponsive(): void {
//     this.server.registerTool(
//       'listen_process_unresponsive',
//       {
//         description: 'Start listening for process unresponsive events',
//         inputSchema: {},
//       },
//       async () => {
//         try {
//           const listener = (process: chrome.processes.Process) => {
//             console.log('Process became unresponsive:', {
//               id: process.id,
//               osProcessId: process.osProcessId,
//               type: process.type,
//               profile: process.profile,
//             });
//           };

//           chrome.processes.onUnresponsive.addListener(listener);

//           return this.formatSuccess('Started listening for process unresponsive events', {
//             event: 'onUnresponsive',
//             status: 'listening',
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerOnUpdated(): void {
//     this.server.registerTool(
//       'listen_process_updated',
//       {
//         description: 'Start listening for process statistics updates',
//         inputSchema: {},
//       },
//       async () => {
//         try {
//           const listener = (processes: Record<string, chrome.processes.Process>) => {
//             const processCount = Object.keys(processes).length;
//             console.log('Process statistics updated:', {
//               processCount,
//               timestamp: new Date().toISOString(),
//             });
//           };

//           chrome.processes.onUpdated.addListener(listener);

//           return this.formatSuccess('Started listening for process update events', {
//             event: 'onUpdated',
//             status: 'listening',
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerOnUpdatedWithMemory(): void {
//     this.server.registerTool(
//       'listen_process_updated_with_memory',
//       {
//         description: 'Start listening for process statistics updates with memory usage details',
//         inputSchema: {},
//       },
//       async () => {
//         try {
//           const listener = (processes: Record<string, chrome.processes.Process>) => {
//             const processCount = Object.keys(processes).length;
//             const totalPrivateMemory = Object.values(processes)
//               .reduce((sum, process) => sum + (process.privateMemory || 0), 0);

//             console.log('Process statistics updated with memory:', {
//               processCount,
//               totalPrivateMemory,
//               timestamp: new Date().toISOString(),
//             });
//           };

//           chrome.processes.onUpdatedWithMemory.addListener(listener);

//           return this.formatSuccess('Started listening for process update events with memory details', {
//             event: 'onUpdatedWithMemory',
//             status: 'listening',
//             note: 'Collecting memory usage information incurs extra CPU usage',
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }
// }
