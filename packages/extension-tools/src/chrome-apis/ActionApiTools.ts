// import { z } from 'zod';
// import { BaseApiTools } from './BaseApiTools';
// import type { McpToolDefinition } from '../types/mcp';

// /**
//  * Chrome Action API Tools
//  * Provides MCP tools for the chrome.action API to control the extension's icon in the toolbar.
//  */
// export class ActionApiTools extends BaseApiTools {
//   protected readonly apiName = 'action';

//   // Zod schemas for validation
//   private readonly tabDetailsSchema = z.object({
//     tabId: z.number().optional()
//   });

//   private readonly openPopupOptionsSchema = z.object({
//     windowId: z.number().optional()
//   });

//   private readonly setBadgeBackgroundColorSchema = z.object({
//     color: z.union([
//       z.string(),
//       z.array(z.number().min(0).max(255)).length(4)
//     ]),
//     tabId: z.number().optional()
//   });

//   private readonly setBadgeTextSchema = z.object({
//     text: z.string().optional(),
//     tabId: z.number().optional()
//   });

//   private readonly setBadgeTextColorSchema = z.object({
//     color: z.union([
//       z.string(),
//       z.array(z.number().min(0).max(255)).length(4)
//     ]),
//     tabId: z.number().optional()
//   });

//   private readonly setIconSchema = z.object({
//     imageData: z.union([
//       z.any(), // ImageData
//       z.record(z.string(), z.any()) // Dictionary of ImageData
//     ]).optional(),
//     path: z.union([
//       z.string(),
//       z.record(z.string(), z.string())
//     ]).optional(),
//     tabId: z.number().optional()
//   }).refine(data => data.imageData || data.path, {
//     message: "Either imageData or path must be specified"
//   });

//   private readonly setPopupSchema = z.object({
//     popup: z.string(),
//     tabId: z.number().optional()
//   });

//   private readonly setTitleSchema = z.object({
//     title: z.string(),
//     tabId: z.number().optional()
//   });

//   private readonly enableDisableSchema = z.object({
//     tabId: z.number().optional()
//   });

//   private readonly isEnabledSchema = z.object({
//     tabId: z.number().optional()
//   });

//   /**
//    * Get all available MCP tools for the Chrome Action API
//    */
//   getTools(): McpToolDefinition[] {
//     return [
//       this.createDisableTool(),
//       this.createEnableTool(),
//       this.createGetBadgeBackgroundColorTool(),
//       this.createGetBadgeTextTool(),
//       this.createGetBadgeTextColorTool(),
//       this.createGetPopupTool(),
//       this.createGetTitleTool(),
//       this.createGetUserSettingsTool(),
//       this.createIsEnabledTool(),
//       this.createOpenPopupTool(),
//       this.createSetBadgeBackgroundColorTool(),
//       this.createSetBadgeTextTool(),
//       this.createSetBadgeTextColorTool(),
//       this.createSetIconTool(),
//       this.createSetPopupTool(),
//       this.createSetTitleTool()
//     ];
//   }

//   /**
//    * Create tool for disabling the action
//    */
//   private createDisableTool(): McpToolDefinition {
//     return {
//       name: `${this.apiName}_disable`,
//       description: 'Disables the action for a tab',
//       inputSchema: {
//         type: 'object',
//         properties: {
//           tabId: {
//             type: 'number',
//             description: 'The ID of the tab for which you want to modify the action'
//           }
//         }
//       }
//     };
//   }

//   /**
//    * Create tool for enabling the action
//    */
//   private createEnableTool(): McpToolDefinition {
//     return {
//       name: `${this.apiName}_enable`,
//       description: 'Enables the action for a tab. By default, actions are enabled',
//       inputSchema: {
//         type: 'object',
//         properties: {
//           tabId: {
//             type: 'number',
//             description: 'The ID of the tab for which you want to modify the action'
//           }
//         }
//       }
//     };
//   }

//   /**
//    * Create tool for getting badge background color
//    */
//   private createGetBadgeBackgroundColorTool(): McpToolDefinition {
//     return {
//       name: `${this.apiName}_getBadgeBackgroundColor`,
//       description: 'Gets the background color of the action',
//       inputSchema: {
//         type: 'object',
//         properties: {
//           tabId: {
//             type: 'number',
//             description: 'The ID of the tab to query state for. If no tab is specified, the non-tab-specific state is returned'
//           }
//         }
//       }
//     };
//   }

//   /**
//    * Create tool for getting badge text
//    */
//   private createGetBadgeTextTool(): McpToolDefinition {
//     return {
//       name: `${this.apiName}_getBadgeText`,
//       description: 'Gets the badge text of the action. If no tab is specified, the non-tab-specific badge text is returned',
//       inputSchema: {
//         type: 'object',
//         properties: {
//           tabId: {
//             type: 'number',
//             description: 'The ID of the tab to query state for. If no tab is specified, the non-tab-specific state is returned'
//           }
//         }
//       }
//     };
//   }

//   /**
//    * Create tool for getting badge text color
//    */
//   private createGetBadgeTextColorTool(): McpToolDefinition {
//     return {
//       name: `${this.apiName}_getBadgeTextColor`,
//       description: 'Gets the text color of the action',
//       inputSchema: {
//         type: 'object',
//         properties: {
//           tabId: {
//             type: 'number',
//             description: 'The ID of the tab to query state for. If no tab is specified, the non-tab-specific state is returned'
//           }
//         }
//       }
//     };
//   }

//   /**
//    * Create tool for getting popup
//    */
//   private createGetPopupTool(): McpToolDefinition {
//     return {
//       name: `${this.apiName}_getPopup`,
//       description: 'Gets the html document set as the popup for this action',
//       inputSchema: {
//         type: 'object',
//         properties: {
//           tabId: {
//             type: 'number',
//             description: 'The ID of the tab to query state for. If no tab is specified, the non-tab-specific state is returned'
//           }
//         }
//       }
//     };
//   }

//   /**
//    * Create tool for getting title
//    */
//   private createGetTitleTool(): McpToolDefinition {
//     return {
//       name: `${this.apiName}_getTitle`,
//       description: 'Gets the title of the action',
//       inputSchema: {
//         type: 'object',
//         properties: {
//           tabId: {
//             type: 'number',
//             description: 'The ID of the tab to query state for. If no tab is specified, the non-tab-specific state is returned'
//           }
//         }
//       }
//     };
//   }

//   /**
//    * Create tool for getting user settings
//    */
//   private createGetUserSettingsTool(): McpToolDefinition {
//     return {
//       name: `${this.apiName}_getUserSettings`,
//       description: 'Returns the user-specified settings relating to an extension\'s action',
//       inputSchema: {
//         type: 'object',
//         properties: {}
//       }
//     };
//   }

//   /**
//    * Create tool for checking if action is enabled
//    */
//   private createIsEnabledTool(): McpToolDefinition {
//     return {
//       name: `${this.apiName}_isEnabled`,
//       description: 'Indicates whether the extension action is enabled for a tab (or globally if no tabId is provided)',
//       inputSchema: {
//         type: 'object',
//         properties: {
//           tabId: {
//             type: 'number',
//             description: 'The ID of the tab for which you want check enabled status'
//           }
//         }
//       }
//     };
//   }

//   /**
//    * Create tool for opening popup
//    */
//   private createOpenPopupTool(): McpToolDefinition {
//     return {
//       name: `${this.apiName}_openPopup`,
//       description: 'Opens the extension\'s popup',
//       inputSchema: {
//         type: 'object',
//         properties: {
//           windowId: {
//             type: 'number',
//             description: 'The ID of the window to open the action popup in. Defaults to the currently-active window if unspecified'
//           }
//         }
//       }
//     };
//   }

//   /**
//    * Create tool for setting badge background color
//    */
//   private createSetBadgeBackgroundColorTool(): McpToolDefinition {
//     return {
//       name: `${this.apiName}_setBadgeBackgroundColor`,
//       description: 'Sets the background color for the badge',
//       inputSchema: {
//         type: 'object',
//         properties: {
//           color: {
//             oneOf: [
//               { type: 'string' },
//               {
//                 type: 'array',
//                 items: { type: 'number', minimum: 0, maximum: 255 },
//                 minItems: 4,
//                 maxItems: 4
//               }
//             ],
//             description: 'An array of four integers in the range [0,255] that make up the RGBA color of the badge, or a string with a CSS color value'
//           },
//           tabId: {
//             type: 'number',
//             description: 'Limits the change to when a particular tab is selected. Automatically resets when the tab is closed'
//           }
//         },
//         required: ['color']
//       }
//     };
//   }

//   /**
//    * Create tool for setting badge text
//    */
//   private createSetBadgeTextTool(): McpToolDefinition {
//     return {
//       name: `${this.apiName}_setBadgeText`,
//       description: 'Sets the badge text for the action. The badge is displayed on top of the icon',
//       inputSchema: {
//         type: 'object',
//         properties: {
//           text: {
//             type: 'string',
//             description: 'Any number of characters can be passed, but only about four can fit in the space. If an empty string is passed, the badge text is cleared'
//           },
//           tabId: {
//             type: 'number',
//             description: 'Limits the change to when a particular tab is selected. Automatically resets when the tab is closed'
//           }
//         }
//       }
//     };
//   }

//   /**
//    * Create tool for setting badge text color
//    */
//   private createSetBadgeTextColorTool(): McpToolDefinition {
//     return {
//       name: `${this.apiName}_setBadgeTextColor`,
//       description: 'Sets the text color for the badge',
//       inputSchema: {
//         type: 'object',
//         properties: {
//           color: {
//             oneOf: [
//               { type: 'string' },
//               {
//                 type: 'array',
//                 items: { type: 'number', minimum: 0, maximum: 255 },
//                 minItems: 4,
//                 maxItems: 4
//               }
//             ],
//             description: 'An array of four integers in the range [0,255] that make up the RGBA color of the badge, or a string with a CSS color value'
//           },
//           tabId: {
//             type: 'number',
//             description: 'Limits the change to when a particular tab is selected. Automatically resets when the tab is closed'
//           }
//         },
//         required: ['color']
//       }
//     };
//   }

//   /**
//    * Create tool for setting icon
//    */
//   private createSetIconTool(): McpToolDefinition {
//     return {
//       name: `${this.apiName}_setIcon`,
//       description: 'Sets the icon for the action. The icon can be specified either as the path to an image file or as the pixel data from a canvas element',
//       inputSchema: {
//         type: 'object',
//         properties: {
//           imageData: {
//             description: 'Either an ImageData object or a dictionary {size -> ImageData} representing icon to be set'
//           },
//           path: {
//             oneOf: [
//               { type: 'string' },
//               { type: 'object' }
//             ],
//             description: 'Either a relative image path or a dictionary {size -> relative image path} pointing to icon to be set'
//           },
//           tabId: {
//             type: 'number',
//             description: 'Limits the change to when a particular tab is selected. Automatically resets when the tab is closed'
//           }
//         }
//       }
//     };
//   }

//   /**
//    * Create tool for setting popup
//    */
//   private createSetPopupTool(): McpToolDefinition {
//     return {
//       name: `${this.apiName}_setPopup`,
//       description: 'Sets the HTML document to be opened as a popup when the user clicks on the action\'s icon',
//       inputSchema: {
//         type: 'object',
//         properties: {
//           popup: {
//             type: 'string',
//             description: 'The relative path to the HTML file to show in a popup. If set to the empty string, no popup is shown'
//           },
//           tabId: {
//             type: 'number',
//             description: 'Limits the change to when a particular tab is selected. Automatically resets when the tab is closed'
//           }
//         },
//         required: ['popup']
//       }
//     };
//   }

//   /**
//    * Create tool for setting title
//    */
//   private createSetTitleTool(): McpToolDefinition {
//     return {
//       name: `${this.apiName}_setTitle`,
//       description: 'Sets the title of the action. This shows up in the tooltip',
//       inputSchema: {
//         type: 'object',
//         properties: {
//           title: {
//             type: 'string',
//             description: 'The string the action should display when moused over'
//           },
//           tabId: {
//             type: 'number',
//             description: 'Limits the change to when a particular tab is selected. Automatically resets when the tab is closed'
//           }
//         },
//         required: ['title']
//       }
//     };
//   }

//   /**
//    * Execute a tool call for the Chrome Action API
//    */
//   async executeTool(name: string, args: any): Promise<any> {
//     if (!this.isAvailable()) {
//       throw new Error(`Chrome ${this.apiName} API is not available`);
//     }

//     const api = (globalThis as any).chrome?.[this.apiName];
//     if (!api) {
//       throw new Error(`Chrome ${this.apiName} API is not accessible`);
//     }

//     try {
//       switch (name) {
//         case `${this.apiName}_disable`:
//           return await this.executeDisable(api, args);
//         case `${this.apiName}_enable`:
//           return await this.executeEnable(api, args);
//         case `${this.apiName}_getBadgeBackgroundColor`:
//           return await this.executeGetBadgeBackgroundColor(api, args);
//         case `${this.apiName}_getBadgeText`:
//           return await this.executeGetBadgeText(api, args);
//         case `${this.apiName}_getBadgeTextColor`:
//           return await this.executeGetBadgeTextColor(api, args);
//         case `${this.apiName}_getPopup`:
//           return await this.executeGetPopup(api, args);
//         case `${this.apiName}_getTitle`:
//           return await this.executeGetTitle(api, args);
//         case `${this.apiName}_getUserSettings`:
//           return await this.executeGetUserSettings(api, args);
//         case `${this.apiName}_isEnabled`:
//           return await this.executeIsEnabled(api, args);
//         case `${this.apiName}_openPopup`:
//           return await this.executeOpenPopup(api, args);
//         case `${this.apiName}_setBadgeBackgroundColor`:
//           return await this.executeSetBadgeBackgroundColor(api, args);
//         case `${this.apiName}_setBadgeText`:
//           return await this.executeSetBadgeText(api, args);
//         case `${this.apiName}_setBadgeTextColor`:
//           return await this.executeSetBadgeTextColor(api, args);
//         case `${this.apiName}_setIcon`:
//           return await this.executeSetIcon(api, args);
//         case `${this.apiName}_setPopup`:
//           return await this.executeSetPopup(api, args);
//         case `${this.apiName}_setTitle`:
//           return await this.executeSetTitle(api, args);
//         default:
//           throw new Error(`Unknown tool: ${name}`);
//       }
//     } catch (error) {
//       throw new Error(`Failed to execute ${name}: ${error instanceof Error ? error.message : String(error)}`);
//     }
//   }

//   /**
//    * Execute disable action
//    */
//   private async executeDisable(api: any, args: any): Promise<void> {
//     const validatedArgs = this.enableDisableSchema.parse(args);

//     return new Promise((resolve, reject) => {
//       const callback = () => {
//         if ((globalThis as any).chrome?.runtime?.lastError) {
//           reject(new Error((globalThis as any).chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       };

//       if (validatedArgs.tabId !== undefined) {
//         api.disable(validatedArgs.tabId, callback);
//       } else {
//         api.disable(callback);
//       }
//     });
//   }

//   /**
//    * Execute enable action
//    */
//   private async executeEnable(api: any, args: any): Promise<void> {
//     const validatedArgs = this.enableDisableSchema.parse(args);

//     return new Promise((resolve, reject) => {
//       const callback = () => {
//         if ((globalThis as any).chrome?.runtime?.lastError) {
//           reject(new Error((globalThis as any).chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       };

//       if (validatedArgs.tabId !== undefined) {
//         api.enable(validatedArgs.tabId, callback);
//       } else {
//         api.enable(callback);
//       }
//     });
//   }

//   /**
//    * Execute get badge background color
//    */
//   private async executeGetBadgeBackgroundColor(api: any, args: any): Promise<number[]> {
//     const validatedArgs = this.tabDetailsSchema.parse(args);

//     return new Promise((resolve, reject) => {
//       const callback = (result: number[]) => {
//         if ((globalThis as any).chrome?.runtime?.lastError) {
//           reject(new Error((globalThis as any).chrome.runtime.lastError.message));
//         } else {
//           resolve(result);
//         }
//       };

//       api.getBadgeBackgroundColor(validatedArgs, callback);
//     });
//   }

//   /**
//    * Execute get badge text
//    */
//   private async executeGetBadgeText(api: any, args: any): Promise<string> {
//     const validatedArgs = this.tabDetailsSchema.parse(args);

//     return new Promise((resolve, reject) => {
//       const callback = (result: string) => {
//         if ((globalThis as any).chrome?.runtime?.lastError) {
//           reject(new Error((globalThis as any).chrome.runtime.lastError.message));
//         } else {
//           resolve(result);
//         }
//       };

//       api.getBadgeText(validatedArgs, callback);
//     });
//   }

//   /**
//    * Execute get badge text color
//    */
//   private async executeGetBadgeTextColor(api: any, args: any): Promise<number[]> {
//     const validatedArgs = this.tabDetailsSchema.parse(args);

//     return new Promise((resolve, reject) => {
//       const callback = (result: number[]) => {
//         if ((globalThis as any).chrome?.runtime?.lastError) {
//           reject(new Error((globalThis as any).chrome.runtime.lastError.message));
//         } else {
//           resolve(result);
//         }
//       };

//       api.getBadgeTextColor(validatedArgs, callback);
//     });
//   }

//   /**
//    * Execute get popup
//    */
//   private async executeGetPopup(api: any, args: any): Promise<string> {
//     const validatedArgs = this.tabDetailsSchema.parse(args);

//     return new Promise((resolve, reject) => {
//       const callback = (result: string) => {
//         if ((globalThis as any).chrome?.runtime?.lastError) {
//           reject(new Error((globalThis as any).chrome.runtime.lastError.message));
//         } else {
//           resolve(result);
//         }
//       };

//       api.getPopup(validatedArgs, callback);
//     });
//   }

//   /**
//    * Execute get title
//    */
//   private async executeGetTitle(api: any, args: any): Promise<string> {
//     const validatedArgs = this.tabDetailsSchema.parse(args);

//     return new Promise((resolve, reject) => {
//       const callback = (result: string) => {
//         if ((globalThis as any).chrome?.runtime?.lastError) {
//           reject(new Error((globalThis as any).chrome.runtime.lastError.message));
//         } else {
//           resolve(result);
//         }
//       };

//       api.getTitle(validatedArgs, callback);
//     });
//   }

//   /**
//    * Execute get user settings
//    */
//   private async executeGetUserSettings(api: any, args: any): Promise<any> {
//     return new Promise((resolve, reject) => {
//       const callback = (result: any) => {
//         if ((globalThis as any).chrome?.runtime?.lastError) {
//           reject(new Error((globalThis as any).chrome.runtime.lastError.message));
//         } else {
//           resolve(result);
//         }
//       };

//       api.getUserSettings(callback);
//     });
//   }

//   /**
//    * Execute is enabled check
//    */
//   private async executeIsEnabled(api: any, args: any): Promise<boolean> {
//     const validatedArgs = this.isEnabledSchema.parse(args);

//     return new Promise((resolve, reject) => {
//       const callback = (result: boolean) => {
//         if ((globalThis as any).chrome?.runtime?.lastError) {
//           reject(new Error((globalThis as any).chrome.runtime.lastError.message));
//         } else {
//           resolve(result);
//         }
//       };

//       if (validatedArgs.tabId !== undefined) {
//         api.isEnabled(validatedArgs.tabId, callback);
//       } else {
//         api.isEnabled(callback);
//       }
//     });
//   }

//   /**
//    * Execute open popup
//    */
//   private async executeOpenPopup(api: any, args: any): Promise<void> {
//     const validatedArgs = this.openPopupOptionsSchema.parse(args);

//     return new Promise((resolve, reject) => {
//       const callback = () => {
//         if ((globalThis as any).chrome?.runtime?.lastError) {
//           reject(new Error((globalThis as any).chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       };

//       if (Object.keys(validatedArgs).length > 0) {
//         api.openPopup(validatedArgs, callback);
//       } else {
//         api.openPopup(callback);
//       }
//     });
//   }

//   /**
//    * Execute set badge background color
//    */
//   private async executeSetBadgeBackgroundColor(api: any, args: any): Promise<void> {
//     const validatedArgs = this.setBadgeBackgroundColorSchema.parse(args);

//     return new Promise((resolve, reject) => {
//       const callback = () => {
//         if ((globalThis as any).chrome?.runtime?.lastError) {
//           reject(new Error((globalThis as any).chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       };

//       api.setBadgeBackgroundColor(validatedArgs, callback);
//     });
//   }

//   /**
//    * Execute set badge text
//    */
//   private async executeSetBadgeText(api: any, args: any): Promise<void> {
//     const validatedArgs = this.setBadgeTextSchema.parse(args);

//     return new Promise((resolve, reject) => {
//       const callback = () => {
//         if ((globalThis as any).chrome?.runtime?.lastError) {
//           reject(new Error((globalThis as any).chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       };

//       api.setBadgeText(validatedArgs, callback);
//     });
//   }

//   /**
//    * Execute set badge text color
//    */
//   private async executeSetBadgeTextColor(api: any, args: any): Promise<void> {
//     const validatedArgs = this.setBadgeTextColorSchema.parse(args);

//     return new Promise((resolve, reject) => {
//       const callback = () => {
//         if ((globalThis as any).chrome?.runtime?.lastError) {
//           reject(new Error((globalThis as any).chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       };

//       api.setBadgeTextColor(validatedArgs, callback);
//     });
//   }

//   /**
//    * Execute set icon
//    */
//   private async executeSetIcon(api: any, args: any): Promise<void> {
//     const validatedArgs = this.setIconSchema.parse(args);

//     return new Promise((resolve, reject) => {
//       const callback = () => {
//         if ((globalThis as any).chrome?.runtime?.lastError) {
//           reject(new Error((globalThis as any).chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       };

//       api.setIcon(validatedArgs, callback);
//     });
//   }

//   /**
//    * Execute set popup
//    */
//   private async executeSetPopup(api: any, args: any): Promise<void> {
//     const validatedArgs = this.setPopupSchema.parse(args);

//     return new Promise((resolve, reject) => {
//       const callback = () => {
//         if ((globalThis as any).chrome?.runtime?.lastError) {
//           reject(new Error((globalThis as any).chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       };

//       api.setPopup(validatedArgs, callback);
//     });
//   }

//   /**
//    * Execute set title
//    */
//   private async executeSetTitle(api: any, args: any): Promise<void> {
//     const validatedArgs = this.setTitleSchema.parse(args);

//     return new Promise((resolve, reject) => {
//       const callback = () => {
//         if ((globalThis as any).chrome?.runtime?.lastError) {
//           reject(new Error((globalThis as any).chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       };

//       api.setTitle(validatedArgs, callback);
//     });
//   }
// }
