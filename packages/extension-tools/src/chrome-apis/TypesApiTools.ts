// import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// import { z } from 'zod';
// import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

// export interface TypesApiToolsOptions {
//   getChromeSetting?: boolean;
//   setChromeSetting?: boolean;
//   clearChromeSetting?: boolean;
//   getChromeSettingScope?: boolean;
//   getLevelOfControl?: boolean;
// }

// export class TypesApiTools extends BaseApiTools {
//   protected apiName = 'Types';

//   constructor(
//     server: McpServer,
//     options: TypesApiToolsOptions = {}
//   ) {
//     super(server, options);
//   }

//   checkAvailability(): ApiAvailability {
//     try {
//       // Check if API exists
//       if (!chrome.types) {
//         return {
//           available: false,
//           message: 'chrome.types API is not defined',
//           details: 'This extension needs access to Chrome settings APIs in its manifest.json',
//         };
//       }

//       // Test basic type definitions
//       if (typeof chrome..ChromeSetting === 'undefined') {
//         return {
//           available: false,
//           message: 'chrome.types.ChromeSetting is not available',
//           details: 'The types API appears to be partially available. Check manifest permissions.',
//         };
//       }

//       return {
//         available: true,
//         message: 'Types API is fully available',
//       };
//     } catch (error) {
//       return {
//         available: false,
//         message: 'Failed to access chrome.types API',
//         details: error instanceof Error ? error.message : 'Unknown error occurred',
//       };
//     }
//   }

//   registerTools(): void {
//     if (this.shouldRegisterTool('getChromeSetting')) {
//       this.registerGetChromeSetting();
//     }

//     if (this.shouldRegisterTool('setChromeSetting')) {
//       this.registerSetChromeSetting();
//     }

//     if (this.shouldRegisterTool('clearChromeSetting')) {
//       this.registerClearChromeSetting();
//     }

//     if (this.shouldRegisterTool('getChromeSettingScope')) {
//       this.registerGetChromeSettingScope();
//     }

//     if (this.shouldRegisterTool('getLevelOfControl')) {
//       this.registerGetLevelOfControl();
//     }
//   }

//   private registerGetChromeSetting(): void {
//     this.server.registerTool(
//       'get_chrome_setting',
//       {
//         description: 'Get the value of a Chrome setting using a ChromeSetting object',
//         inputSchema: {
//           settingPath: z.string().describe('Path to the Chrome setting (e.g., "privacy.services.passwordSavingEnabled")'),
//           incognito: z.boolean().optional().describe('Whether to return the value that applies to the incognito session (default false)'),
//         },
//       },
//       async ({ settingPath, incognito }) => {
//         try {
//           // Navigate to the setting object
//           const settingObject = this.getSettingByPath(settingPath);
//           if (!settingObject || typeof settingObject.get !== 'function') {
//             return this.formatError(`Setting not found or not accessible: ${settingPath}`);
//           }

//           const details = await new Promise<any>((resolve, reject) => {
//             const getDetails: any = {};
//             if (incognito !== undefined) {
//               getDetails.incognito = incognito;
//             }

//             settingObject.get(getDetails, (result: any) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(result);
//               }
//             });
//           });

//           return this.formatJson({
//             settingPath,
//             value: details.value,
//             levelOfControl: details.levelOfControl,
//             incognitoSpecific: details.incognitoSpecific,
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerSetChromeSetting(): void {
//     this.server.registerTool(
//       'set_chrome_setting',
//       {
//         description: 'Set the value of a Chrome setting using a ChromeSetting object',
//         inputSchema: {
//           settingPath: z.string().describe('Path to the Chrome setting (e.g., "privacy.services.passwordSavingEnabled")'),
//           value: z.any().describe('The value to set for the setting'),
//           scope: z.enum(['regular', 'regular_only', 'incognito_persistent', 'incognito_session_only']).optional().describe('Where to set the setting (default: regular)'),
//         },
//       },
//       async ({ settingPath, value, scope }) => {
//         try {
//           // Navigate to the setting object
//           const settingObject = this.getSettingByPath(settingPath);
//           if (!settingObject || typeof settingObject.set !== 'function') {
//             return this.formatError(`Setting not found or not accessible: ${settingPath}`);
//           }

//           const setDetails: any = { value };
//           if (scope !== undefined) {
//             setDetails.scope = scope;
//           }

//           await new Promise<void>((resolve, reject) => {
//             settingObject.set(setDetails, () => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve();
//               }
//             });
//           });

//           return this.formatSuccess('Chrome setting updated successfully', {
//             settingPath,
//             value,
//             scope: scope || 'regular',
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerClearChromeSetting(): void {
//     this.server.registerTool(
//       'clear_chrome_setting',
//       {
//         description: 'Clear a Chrome setting, restoring any default value',
//         inputSchema: {
//           settingPath: z.string().describe('Path to the Chrome setting (e.g., "privacy.services.passwordSavingEnabled")'),
//           scope: z.enum(['regular', 'regular_only', 'incognito_persistent', 'incognito_session_only']).optional().describe('Where to clear the setting (default: regular)'),
//         },
//       },
//       async ({ settingPath, scope }) => {
//         try {
//           // Navigate to the setting object
//           const settingObject = this.getSettingByPath(settingPath);
//           if (!settingObject || typeof settingObject.clear !== 'function') {
//             return this.formatError(`Setting not found or not accessible: ${settingPath}`);
//           }

//           const clearDetails: any = {};
//           if (scope !== undefined) {
//             clearDetails.scope = scope;
//           }

//           await new Promise<void>((resolve, reject) => {
//             settingObject.clear(clearDetails, () => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve();
//               }
//             });
//           });

//           return this.formatSuccess('Chrome setting cleared successfully', {
//             settingPath,
//             scope: scope || 'regular',
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerGetChromeSettingScope(): void {
//     this.server.registerTool(
//       'get_chrome_setting_scope',
//       {
//         description: 'Get information about Chrome setting scopes and their meanings',
//         inputSchema: {},
//       },
//       async () => {
//         try {
//           const scopeInfo = {
//             scopes: {
//               regular: {
//                 description: 'Setting for the regular profile (inherited by incognito if not overridden)',
//                 persistent: true,
//                 appliesToIncognito: true,
//               },
//               regular_only: {
//                 description: 'Setting for the regular profile only (not inherited by incognito)',
//                 persistent: true,
//                 appliesToIncognito: false,
//               },
//               incognito_persistent: {
//                 description: 'Setting for incognito profile that survives browser restarts (overrides regular)',
//                 persistent: true,
//                 appliesToIncognito: true,
//               },
//               incognito_session_only: {
//                 description: 'Setting for incognito profile that is deleted when incognito session ends',
//                 persistent: false,
//                 appliesToIncognito: true,
//               },
//             },
//             precedence: [
//               'System settings (lowest precedence)',
//               'Command-line parameters',
//               'Extension settings',
//               'Policies (highest precedence)',
//             ],
//           };

//           return this.formatJson(scopeInfo);
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerGetLevelOfControl(): void {
//     this.server.registerTool(
//       'get_level_of_control',
//       {
//         description: 'Get information about Chrome setting control levels and their meanings',
//         inputSchema: {},
//       },
//       async () => {
//         try {
//           const controlLevels = {
//             levels: {
//               not_controllable: {
//                 description: 'Cannot be controlled by any extension',
//                 canModify: false,
//               },
//               controlled_by_other_extensions: {
//                 description: 'Controlled by extensions with higher precedence',
//                 canModify: false,
//               },
//               controllable_by_this_extension: {
//                 description: 'Can be controlled by this extension',
//                 canModify: true,
//               },
//               controlled_by_this_extension: {
//                 description: 'Currently controlled by this extension',
//                 canModify: true,
//               },
//             },
//             precedenceRules: [
//               'Most recently installed extension takes precedence',
//               'If most recent extension only sets incognito settings, regular settings can be controlled by other extensions',
//               'Policies always override extension settings',
//             ],
//           };

//           return this.formatJson(controlLevels);
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private getSettingByPath(path: string): any {
//     try {
//       const parts = path.split('.');
//       let current: any = chrome;

//       for (const part of parts) {
//         if (current && typeof current === 'object' && part in current) {
//           current = current[part];
//         } else {
//           return null;
//         }
//       }

//       return current;
//     } catch (error) {
//       return null;
//     }
//   }
// }
