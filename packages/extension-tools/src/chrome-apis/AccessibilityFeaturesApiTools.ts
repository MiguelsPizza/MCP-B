// import { z } from 'zod';
// import { BaseApiTools } from './BaseApiTools.js';
// import type { McpTool } from '../types/mcp.js';

// /**
//  * Chrome AccessibilityFeatures API Tools
//  * Provides MCP tools for managing Chrome's accessibility features
//  */
// export class AccessibilityFeaturesApiTools extends BaseApiTools {
//   protected readonly apiName = 'accessibilityFeatures';

//   /**
//    * Zod schema for animation policy values
//    */
//   private readonly animationPolicySchema = z.enum(['allowed', 'once', 'none']);

//   /**
//    * Zod schema for ChromeSetting get parameters
//    */
//   private readonly getSettingSchema = z.object({
//     incognito: z.boolean().optional()
//   });

//   /**
//    * Zod schema for ChromeSetting set parameters for boolean features
//    */
//   private readonly setBooleanSettingSchema = z.object({
//     value: z.boolean(),
//     scope: z.enum(['regular', 'regular_only', 'incognito_persistent', 'incognito_session_only']).optional()
//   });

//   /**
//    * Zod schema for ChromeSetting set parameters for animation policy
//    */
//   private readonly setAnimationPolicySettingSchema = z.object({
//     value: this.animationPolicySchema,
//     scope: z.enum(['regular', 'regular_only', 'incognito_persistent', 'incognito_session_only']).optional()
//   });

//   /**
//    * Zod schema for ChromeSetting clear parameters
//    */
//   private readonly clearSettingSchema = z.object({
//     scope: z.enum(['regular', 'regular_only', 'incognito_persistent', 'incognito_session_only']).optional()
//   });

//   /**
//    * Get animation policy setting
//    */
//   private async getAnimationPolicy(args: z.infer<typeof this.getSettingSchema>): Promise<any> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.animationPolicy.get(args, (details) => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve(details);
//         }
//       });
//     });
//   }

//   /**
//    * Set animation policy setting
//    */
//   private async setAnimationPolicy(args: z.infer<typeof this.setAnimationPolicySettingSchema>): Promise<void> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.animationPolicy.set(args, () => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       });
//     });
//   }

//   /**
//    * Clear animation policy setting
//    */
//   private async clearAnimationPolicy(args: z.infer<typeof this.clearSettingSchema>): Promise<void> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.animationPolicy.clear(args, () => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       });
//     });
//   }

//   /**
//    * Get autoclick setting
//    */
//   private async getAutoclick(args: z.infer<typeof this.getSettingSchema>): Promise<any> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.autoclick.get(args, (details) => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve(details);
//         }
//       });
//     });
//   }

//   /**
//    * Set autoclick setting
//    */
//   private async setAutoclick(args: z.infer<typeof this.setBooleanSettingSchema>): Promise<void> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.autoclick.set(args, () => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       });
//     });
//   }

//   /**
//    * Clear autoclick setting
//    */
//   private async clearAutoclick(args: z.infer<typeof this.clearSettingSchema>): Promise<void> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.autoclick.clear(args, () => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       });
//     });
//   }

//   /**
//    * Get caret highlight setting
//    */
//   private async getCaretHighlight(args: z.infer<typeof this.getSettingSchema>): Promise<any> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.caretHighlight.get(args, (details) => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve(details);
//         }
//       });
//     });
//   }

//   /**
//    * Set caret highlight setting
//    */
//   private async setCaretHighlight(args: z.infer<typeof this.setBooleanSettingSchema>): Promise<void> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.caretHighlight.set(args, () => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       });
//     });
//   }

//   /**
//    * Clear caret highlight setting
//    */
//   private async clearCaretHighlight(args: z.infer<typeof this.clearSettingSchema>): Promise<void> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.caretHighlight.clear(args, () => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       });
//     });
//   }

//   /**
//    * Get cursor color setting
//    */
//   private async getCursorColor(args: z.infer<typeof this.getSettingSchema>): Promise<any> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.cursorColor.get(args, (details) => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve(details);
//         }
//       });
//     });
//   }

//   /**
//    * Set cursor color setting
//    */
//   private async setCursorColor(args: z.infer<typeof this.setBooleanSettingSchema>): Promise<void> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.cursorColor.set(args, () => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       });
//     });
//   }

//   /**
//    * Clear cursor color setting
//    */
//   private async clearCursorColor(args: z.infer<typeof this.clearSettingSchema>): Promise<void> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.cursorColor.clear(args, () => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       });
//     });
//   }

//   /**
//    * Get cursor highlight setting
//    */
//   private async getCursorHighlight(args: z.infer<typeof this.getSettingSchema>): Promise<any> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.cursorHighlight.get(args, (details) => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve(details);
//         }
//       });
//     });
//   }

//   /**
//    * Set cursor highlight setting
//    */
//   private async setCursorHighlight(args: z.infer<typeof this.setBooleanSettingSchema>): Promise<void> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.cursorHighlight.set(args, () => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       });
//     });
//   }

//   /**
//    * Clear cursor highlight setting
//    */
//   private async clearCursorHighlight(args: z.infer<typeof this.clearSettingSchema>): Promise<void> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.cursorHighlight.clear(args, () => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       });
//     });
//   }

//   /**
//    * Get dictation setting
//    */
//   private async getDictation(args: z.infer<typeof this.getSettingSchema>): Promise<any> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.dictation.get(args, (details) => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve(details);
//         }
//       });
//     });
//   }

//   /**
//    * Set dictation setting
//    */
//   private async setDictation(args: z.infer<typeof this.setBooleanSettingSchema>): Promise<void> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.dictation.set(args, () => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       });
//     });
//   }

//   /**
//    * Clear dictation setting
//    */
//   private async clearDictation(args: z.infer<typeof this.clearSettingSchema>): Promise<void> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.dictation.clear(args, () => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       });
//     });
//   }

//   /**
//    * Get docked magnifier setting
//    */
//   private async getDockedMagnifier(args: z.infer<typeof this.getSettingSchema>): Promise<any> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.dockedMagnifier.get(args, (details) => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve(details);
//         }
//       });
//     });
//   }

//   /**
//    * Set docked magnifier setting
//    */
//   private async setDockedMagnifier(args: z.infer<typeof this.setBooleanSettingSchema>): Promise<void> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.dockedMagnifier.set(args, () => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       });
//     });
//   }

//   /**
//    * Clear docked magnifier setting
//    */
//   private async clearDockedMagnifier(args: z.infer<typeof this.clearSettingSchema>): Promise<void> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.dockedMagnifier.clear(args, () => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       });
//     });
//   }

//   /**
//    * Get focus highlight setting
//    */
//   private async getFocusHighlight(args: z.infer<typeof this.getSettingSchema>): Promise<any> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.focusHighlight.get(args, (details) => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve(details);
//         }
//       });
//     });
//   }

//   /**
//    * Set focus highlight setting
//    */
//   private async setFocusHighlight(args: z.infer<typeof this.setBooleanSettingSchema>): Promise<void> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.focusHighlight.set(args, () => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       });
//     });
//   }

//   /**
//    * Clear focus highlight setting
//    */
//   private async clearFocusHighlight(args: z.infer<typeof this.clearSettingSchema>): Promise<void> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.focusHighlight.clear(args, () => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       });
//     });
//   }

//   /**
//    * Get high contrast setting
//    */
//   private async getHighContrast(args: z.infer<typeof this.getSettingSchema>): Promise<any> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.highContrast.get(args, (details) => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve(details);
//         }
//       });
//     });
//   }

//   /**
//    * Set high contrast setting
//    */
//   private async setHighContrast(args: z.infer<typeof this.setBooleanSettingSchema>): Promise<void> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.highContrast.set(args, () => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       });
//     });
//   }

//   /**
//    * Clear high contrast setting
//    */
//   private async clearHighContrast(args: z.infer<typeof this.clearSettingSchema>): Promise<void> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.highContrast.clear(args, () => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       });
//     });
//   }

//   /**
//    * Get large cursor setting
//    */
//   private async getLargeCursor(args: z.infer<typeof this.getSettingSchema>): Promise<any> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.largeCursor.get(args, (details) => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve(details);
//         }
//       });
//     });
//   }

//   /**
//    * Set large cursor setting
//    */
//   private async setLargeCursor(args: z.infer<typeof this.setBooleanSettingSchema>): Promise<void> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.largeCursor.set(args, () => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       });
//     });
//   }

//   /**
//    * Clear large cursor setting
//    */
//   private async clearLargeCursor(args: z.infer<typeof this.clearSettingSchema>): Promise<void> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.largeCursor.clear(args, () => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       });
//     });
//   }

//   /**
//    * Get screen magnifier setting
//    */
//   private async getScreenMagnifier(args: z.infer<typeof this.getSettingSchema>): Promise<any> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.screenMagnifier.get(args, (details) => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve(details);
//         }
//       });
//     });
//   }

//   /**
//    * Set screen magnifier setting
//    */
//   private async setScreenMagnifier(args: z.infer<typeof this.setBooleanSettingSchema>): Promise<void> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.screenMagnifier.set(args, () => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       });
//     });
//   }

//   /**
//    * Clear screen magnifier setting
//    */
//   private async clearScreenMagnifier(args: z.infer<typeof this.clearSettingSchema>): Promise<void> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.screenMagnifier.clear(args, () => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       });
//     });
//   }

//   /**
//    * Get select to speak setting
//    */
//   private async getSelectToSpeak(args: z.infer<typeof this.getSettingSchema>): Promise<any> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.selectToSpeak.get(args, (details) => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve(details);
//         }
//       });
//     });
//   }

//   /**
//    * Set select to speak setting
//    */
//   private async setSelectToSpeak(args: z.infer<typeof this.setBooleanSettingSchema>): Promise<void> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.selectToSpeak.set(args, () => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       });
//     });
//   }

//   /**
//    * Clear select to speak setting
//    */
//   private async clearSelectToSpeak(args: z.infer<typeof this.clearSettingSchema>): Promise<void> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.selectToSpeak.clear(args, () => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       });
//     });
//   }

//   /**
//    * Get spoken feedback setting
//    */
//   private async getSpokenFeedback(args: z.infer<typeof this.getSettingSchema>): Promise<any> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.spokenFeedback.get(args, (details) => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve(details);
//         }
//       });
//     });
//   }

//   /**
//    * Set spoken feedback setting
//    */
//   private async setSpokenFeedback(args: z.infer<typeof this.setBooleanSettingSchema>): Promise<void> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.spokenFeedback.set(args, () => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       });
//     });
//   }

//   /**
//    * Clear spoken feedback setting
//    */
//   private async clearSpokenFeedback(args: z.infer<typeof this.clearSettingSchema>): Promise<void> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.spokenFeedback.clear(args, () => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       });
//     });
//   }

//   /**
//    * Get sticky keys setting
//    */
//   private async getStickyKeys(args: z.infer<typeof this.getSettingSchema>): Promise<any> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.stickyKeys.get(args, (details) => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve(details);
//         }
//       });
//     });
//   }

//   /**
//    * Set sticky keys setting
//    */
//   private async setStickyKeys(args: z.infer<typeof this.setBooleanSettingSchema>): Promise<void> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.stickyKeys.set(args, () => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       });
//     });
//   }

//   /**
//    * Clear sticky keys setting
//    */
//   private async clearStickyKeys(args: z.infer<typeof this.clearSettingSchema>): Promise<void> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.stickyKeys.clear(args, () => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       });
//     });
//   }

//   /**
//    * Get switch access setting
//    */
//   private async getSwitchAccess(args: z.infer<typeof this.getSettingSchema>): Promise<any> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.switchAccess.get(args, (details) => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve(details);
//         }
//       });
//     });
//   }

//   /**
//    * Set switch access setting
//    */
//   private async setSwitchAccess(args: z.infer<typeof this.setBooleanSettingSchema>): Promise<void> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.switchAccess.set(args, () => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       });
//     });
//   }

//   /**
//    * Clear switch access setting
//    */
//   private async clearSwitchAccess(args: z.infer<typeof this.clearSettingSchema>): Promise<void> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.switchAccess.clear(args, () => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       });
//     });
//   }

//   /**
//    * Get virtual keyboard setting
//    */
//   private async getVirtualKeyboard(args: z.infer<typeof this.getSettingSchema>): Promise<any> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.virtualKeyboard.get(args, (details) => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve(details);
//         }
//       });
//     });
//   }

//   /**
//    * Set virtual keyboard setting
//    */
//   private async setVirtualKeyboard(args: z.infer<typeof this.setBooleanSettingSchema>): Promise<void> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.virtualKeyboard.set(args, () => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       });
//     });
//   }

//   /**
//    * Clear virtual keyboard setting
//    */
//   private async clearVirtualKeyboard(args: z.infer<typeof this.clearSettingSchema>): Promise<void> {
//     return new Promise((resolve, reject) => {
//       chrome.accessibilityFeatures.virtualKeyboard.clear(args, () => {
//         if (chrome.runtime.lastError) {
//           reject(new Error(chrome.runtime.lastError.message));
//         } else {
//           resolve();
//         }
//       });
//     });
//   }

//   /**
//    * Get all available MCP tools for the AccessibilityFeatures API
//    */
//   getTools(): McpTool[] {
//     return [
//       // Animation Policy tools
//       {
//         name: `${this.apiName}_get_animation_policy`,
//         description: 'Get the current animation policy setting',
//         inputSchema: {
//           type: 'object',
//           properties: {
//             incognito: {
//               type: 'boolean',
//               description: 'Whether to return the value that applies to the incognito session',
//               optional: true
//             }
//           }
//         }
//       },
//       {
//         name: `${this.apiName}_set_animation_policy`,
//         description: 'Set the animation policy setting',
//         inputSchema: {
//           type: 'object',
//           properties: {
//             value: {
//               type: 'string',
//               enum: ['allowed', 'once', 'none'],
//               description: 'The animation policy value to set'
//             },
//             scope: {
//               type: 'string',
//               enum: ['regular', 'regular_only', 'incognito_persistent', 'incognito_session_only'],
//               description: 'The scope of the ChromeSetting',
//               optional: true
//             }
//           },
//           required: ['value']
//         }
//       },
//       {
//         name: `${this.apiName}_clear_animation_policy`,
//         description: 'Clear the animation policy setting',
//         inputSchema: {
//           type: 'object',
//           properties: {
//             scope: {
//               type: 'string',
//               enum: ['regular', 'regular_only', 'incognito_persistent', 'incognito_session_only'],
//               description: 'The scope of the ChromeSetting',
//               optional: true
//             }
//           }
//         }
//       },

//       // Autoclick tools
//       {
//         name: `${this.apiName}_get_autoclick`,
//         description: 'Get the current autoclick setting (ChromeOS only)',
//         inputSchema: {
//           type: 'object',
//           properties: {
//             incognito: {
//               type: 'boolean',
//               description: 'Whether to return the value that applies to the incognito session',
//               optional: true
//             }
//           }
//         }
//       },
//       {
//         name: `${this.apiName}_set_autoclick`,
//         description: 'Set the autoclick setting (ChromeOS only)',
//         inputSchema: {
//           type: 'object',
//           properties: {
//             value: {
//               type: 'boolean',
//               description: 'Whether to enable autoclick'
//             },
//             scope: {
//               type: 'string',
//               enum: ['regular', 'regular_only', 'incognito_persistent', 'incognito_session_only'],
//               description: 'The scope of the ChromeSetting',
//               optional: true
//             }
//           },
//           required: ['value']
//         }
//       },
//       {
//         name: `${this.apiName}_clear_autoclick`,
//         description: 'Clear the autoclick setting (ChromeOS only)',
//         inputSchema: {
//           type: 'object',
//           properties: {
//             scope: {
//               type: 'string',
//               enum: ['regular', 'regular_only', 'incognito_persistent', 'incognito_session_only'],
//               description: 'The scope of the ChromeSetting',
//               optional: true
//             }
//           }
//         }
//       },

//       // Caret Highlight tools
//       {
//         name: `${this.apiName}_get_caret_highlight`,
//         description: 'Get the current caret highlight setting (ChromeOS only)',
//         inputSchema: {
//           type: 'object',
//           properties: {
//             incognito: {
//               type: 'boolean',
//               description: 'Whether to return the value that applies to the incognito session',
//               optional: true
//             }
//           }
//         }
//       },
//       {
//         name: `${this.apiName}_set_caret_highlight`,
//         description: 'Set the caret highlight setting (ChromeOS only)',
//         inputSchema: {
//           type: 'object',
//           properties: {
//             value: {
//               type: 'boolean',
//               description: 'Whether to enable caret highlighting'
//             },
//             scope: {
//               type: 'string',
//               enum: ['regular', 'regular_only', 'incognito_persistent', 'incognito_session_only'],
//               description: 'The scope of the ChromeSetting',
//               optional: true
//             }
//           },
//           required: ['value']
//         }
//       },
//       {
//         name: `${this.apiName}_clear_caret_highlight`,
//         description: 'Clear the caret highlight setting (ChromeOS only)',
//         inputSchema: {
//           type: 'object',
//           properties: {
//             scope: {
//               type: 'string',
//               enum: ['regular', 'regular_only', 'incognito_persistent', 'incognito_session_only'],
//               description: 'The scope of the ChromeSetting',
//               optional: true
//             }
//           }
//         }
//       },

//       // Cursor Color tools
//       {
//         name: `${this.apiName}_get_cursor_color`,
//         description: 'Get the current cursor color setting (ChromeOS only)',
//         inputSchema: {
//           type: 'object',
//           properties: {
//             incognito: {
//               type: 'boolean',
//               description: 'Whether to return the value that applies to the
