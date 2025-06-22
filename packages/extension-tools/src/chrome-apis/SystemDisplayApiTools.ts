// import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// import { z } from 'zod';
// import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

// export interface SystemDisplayApiToolsOptions {
//   getInfo?: boolean;
//   getDisplayLayout?: boolean;
//   setDisplayProperties?: boolean;
//   setMirrorMode?: boolean;
//   overscanCalibrationStart?: boolean;
//   overscanCalibrationAdjust?: boolean;
//   overscanCalibrationReset?: boolean;
//   overscanCalibrationComplete?: boolean;
//   showNativeTouchCalibration?: boolean;
//   startCustomTouchCalibration?: boolean;
//   completeCustomTouchCalibration?: boolean;
//   clearTouchCalibration?: boolean;
//   setDisplayLayout?: boolean;
//   enableUnifiedDesktop?: boolean;
// }

// export class SystemDisplayApiTools extends BaseApiTools {
//   protected apiName = 'System.display';

//   constructor(server: McpServer, options: SystemDisplayApiToolsOptions = {}) {
//     super(server, options);
//   }

//   checkAvailability(): ApiAvailability {
//     try {
//       // Check if API exists
//       if (!chrome.system || !chrome.system.display) {
//         return {
//           available: false,
//           message: 'chrome.system.display API is not defined',
//           details: 'This extension needs the "system.display" permission in its manifest.json',
//         };
//       }

//       // Test a basic method
//       if (typeof chrome.system.display.getInfo !== 'function') {
//         return {
//           available: false,
//           message: 'chrome.system.display.getInfo is not available',
//           details:
//             'The system.display API appears to be partially available. Check manifest permissions.',
//         };
//       }

//       // Try to actually use the API
//       chrome.system.display.getInfo((_displays) => {
//         if (chrome.runtime.lastError) {
//           throw new Error(chrome.runtime.lastError.message);
//         }
//       });

//       return {
//         available: true,
//         message: 'System.display API is fully available',
//       };
//     } catch (error) {
//       return {
//         available: false,
//         message: 'Failed to access chrome.system.display API',
//         details: error instanceof Error ? error.message : 'Unknown error occurred',
//       };
//     }
//   }

//   registerTools(): void {
//     if (this.shouldRegisterTool('getInfo')) {
//       this.registerGetInfo();
//     }

//     if (this.shouldRegisterTool('getDisplayLayout')) {
//       this.registerGetDisplayLayout();
//     }

//     if (this.shouldRegisterTool('setDisplayProperties')) {
//       this.registerSetDisplayProperties();
//     }

//     if (this.shouldRegisterTool('setMirrorMode')) {
//       this.registerSetMirrorMode();
//     }

//     if (this.shouldRegisterTool('overscanCalibrationStart')) {
//       this.registerOverscanCalibrationStart();
//     }

//     if (this.shouldRegisterTool('overscanCalibrationAdjust')) {
//       this.registerOverscanCalibrationAdjust();
//     }

//     if (this.shouldRegisterTool('overscanCalibrationReset')) {
//       this.registerOverscanCalibrationReset();
//     }

//     if (this.shouldRegisterTool('overscanCalibrationComplete')) {
//       this.registerOverscanCalibrationComplete();
//     }

//     if (this.shouldRegisterTool('showNativeTouchCalibration')) {
//       this.registerShowNativeTouchCalibration();
//     }

//     if (this.shouldRegisterTool('startCustomTouchCalibration')) {
//       this.registerStartCustomTouchCalibration();
//     }

//     if (this.shouldRegisterTool('completeCustomTouchCalibration')) {
//       this.registerCompleteCustomTouchCalibration();
//     }

//     if (this.shouldRegisterTool('clearTouchCalibration')) {
//       this.registerClearTouchCalibration();
//     }

//     if (this.shouldRegisterTool('setDisplayLayout')) {
//       this.registerSetDisplayLayout();
//     }

//     if (this.shouldRegisterTool('enableUnifiedDesktop')) {
//       this.registerEnableUnifiedDesktop();
//     }
//   }

//   private registerGetInfo(): void {
//     this.server.registerTool(
//       'get_display_info',
//       {
//         description: 'Get information about all connected displays',
//         inputSchema: {
//           singleUnified: z
//             .boolean()
//             .optional()
//             .describe('If true, returns a single display representing the entire desktop'),
//         },
//       },
//       async ({ singleUnified }) => {
//         try {
//           const displays = await new Promise<chrome.system.display.DisplayInfo[]>(
//             (resolve, reject) => {
//               const options = singleUnified !== undefined ? { singleUnified } : undefined;
//               chrome.system.display.getInfo(options, (displays) => {
//                 if (chrome.runtime.lastError) {
//                   reject(new Error(chrome.runtime.lastError.message));
//                 } else {
//                   resolve(displays);
//                 }
//               });
//             }
//           );

//           return this.formatJson({
//             count: displays.length,
//             displays: displays.map((display) => ({
//               id: display.id,
//               name: display.name,
//               mirroringSourceId: display.mirroringSourceId,
//               isPrimary: display.isPrimary,
//               isInternal: display.isInternal,
//               isEnabled: display.isEnabled,
//               dpiX: display.dpiX,
//               dpiY: display.dpiY,
//               rotation: display.rotation,
//               bounds: display.bounds,
//               overscan: display.overscan,
//               workArea: display.workArea,
//               modes: display.modes,
//               hasTouchSupport: display.hasTouchSupport,
//               hasAccelerometerSupport: display.hasAccelerometerSupport,
//               availableDisplayZoomFactors: display.availableDisplayZoomFactors,
//               displayZoomFactor: display.displayZoomFactor,
//             })),
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerGetDisplayLayout(): void {
//     this.server.registerTool(
//       'get_display_layout',
//       {
//         description: 'Get the layout of all displays',
//         inputSchema: {},
//       },
//       async () => {
//         try {
//           const layouts = await new Promise<chrome.system.display.DisplayLayout[]>(
//             (resolve, reject) => {
//               chrome.system.display.getDisplayLayout((layouts) => {
//                 if (chrome.runtime.lastError) {
//                   reject(new Error(chrome.runtime.lastError.message));
//                 } else {
//                   resolve(layouts);
//                 }
//               });
//             }
//           );

//           return this.formatJson({
//             count: layouts.length,
//             layouts: layouts.map((layout) => ({
//               id: layout.id,
//               parentId: layout.parentId,
//               position: layout.position,
//               offset: layout.offset,
//             })),
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerSetDisplayProperties(): void {
//     this.server.registerTool(
//       'set_display_properties',
//       {
//         description: 'Set properties for a specific display',
//         inputSchema: {
//           id: z.string().describe('The display ID to modify'),
//           isUnified: z
//             .boolean()
//             .optional()
//             .describe('If true, makes the display the primary display'),
//           mirroringSourceId: z.string().optional().describe('The source display ID for mirroring'),
//           isPrimary: z.boolean().optional().describe('Whether this display should be primary'),
//           overscan: z
//             .object({
//               left: z.number(),
//               top: z.number(),
//               right: z.number(),
//               bottom: z.number(),
//             })
//             .optional()
//             .describe('Overscan insets in pixels'),
//           rotation: z
//             .enum(['0', '90', '180', '270'])
//             .optional()
//             .describe('Display rotation in degrees'),
//           boundsOriginX: z.number().optional().describe('X coordinate of display bounds origin'),
//           boundsOriginY: z.number().optional().describe('Y coordinate of display bounds origin'),
//           displayMode: z
//             .object({
//               width: z.number(),
//               height: z.number(),
//               widthInNativePixels: z.number().optional(),
//               heightInNativePixels: z.number().optional(),
//               uiScale: z.number().optional(),
//               deviceScaleFactor: z.number().optional(),
//               refreshRate: z.number().optional(),
//               isNative: z.boolean().optional(),
//               isSelected: z.boolean().optional(),
//             })
//             .optional()
//             .describe('Display mode settings'),
//           displayZoomFactor: z.number().optional().describe('Display zoom factor'),
//         },
//       },
//       async ({
//         id,
//         isUnified,
//         mirroringSourceId,
//         isPrimary,
//         overscan,
//         rotation,
//         boundsOriginX,
//         boundsOriginY,
//         displayMode,
//         displayZoomFactor,
//       }) => {
//         try {
//           const properties: chrome.system.display.DisplayProperties = {};

//           if (isUnified !== undefined) properties.isUnified = isUnified;
//           if (mirroringSourceId !== undefined) properties.mirroringSourceId = mirroringSourceId;
//           if (isPrimary !== undefined) properties.isPrimary = isPrimary;
//           if (overscan !== undefined) properties.overscan = overscan;
//           if (rotation !== undefined) properties.rotation = parseInt(rotation);
//           if (boundsOriginX !== undefined) properties.boundsOriginX = boundsOriginX;
//           if (boundsOriginY !== undefined) properties.boundsOriginY = boundsOriginY;
//           if (displayMode !== undefined) properties.displayMode = displayMode;
//           if (displayZoomFactor !== undefined) properties.displayZoomFactor = displayZoomFactor;

//           await new Promise<void>((resolve, reject) => {
//             chrome.system.display.setDisplayProperties(id, properties, () => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve();
//               }
//             });
//           });

//           return this.formatSuccess('Display properties updated successfully', { id });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerSetMirrorMode(): void {
//     this.server.registerTool(
//       'set_mirror_mode',
//       {
//         description: 'Set the mirror mode for displays',
//         inputSchema: {
//           mode: z.enum(['off', 'normal', 'mixed']).describe('Mirror mode to set'),
//         },
//       },
//       async ({ mode }) => {
//         try {
//           const mirrorModeInfo: chrome.system.display.MirrorModeInfo = { mode };

//           await new Promise<void>((resolve, reject) => {
//             chrome.system.display.setMirrorMode(mirrorModeInfo, () => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve();
//               }
//             });
//           });

//           return this.formatSuccess('Mirror mode set successfully', { mode });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerOverscanCalibrationStart(): void {
//     this.server.registerTool(
//       'overscan_calibration_start',
//       {
//         description: 'Start overscan calibration for a display',
//         inputSchema: {
//           id: z.string().describe('The display ID to calibrate'),
//         },
//       },
//       async ({ id }) => {
//         try {
//           await new Promise<void>((resolve, reject) => {
//             chrome.system.display.overscanCalibrationStart(id, () => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve();
//               }
//             });
//           });

//           return this.formatSuccess('Overscan calibration started', { id });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerOverscanCalibrationAdjust(): void {
//     this.server.registerTool(
//       'overscan_calibration_adjust',
//       {
//         description: 'Adjust overscan calibration for a display',
//         inputSchema: {
//           id: z.string().describe('The display ID being calibrated'),
//           delta: z
//             .object({
//               left: z.number(),
//               top: z.number(),
//               right: z.number(),
//               bottom: z.number(),
//             })
//             .describe('Delta values for overscan adjustment'),
//         },
//       },
//       async ({ id, delta }) => {
//         try {
//           await new Promise<void>((resolve, reject) => {
//             chrome.system.display.overscanCalibrationAdjust(id, delta, () => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve();
//               }
//             });
//           });

//           return this.formatSuccess('Overscan calibration adjusted', { id, delta });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerOverscanCalibrationReset(): void {
//     this.server.registerTool(
//       'overscan_calibration_reset',
//       {
//         description: 'Reset overscan calibration for a display',
//         inputSchema: {
//           id: z.string().describe('The display ID to reset calibration for'),
//         },
//       },
//       async ({ id }) => {
//         try {
//           await new Promise<void>((resolve, reject) => {
//             chrome.system.display.overscanCalibrationReset(id, () => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve();
//               }
//             });
//           });

//           return this.formatSuccess('Overscan calibration reset', { id });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerOverscanCalibrationComplete(): void {
//     this.server.registerTool(
//       'overscan_calibration_complete',
//       {
//         description: 'Complete overscan calibration for a display',
//         inputSchema: {
//           id: z.string().describe('The display ID to complete calibration for'),
//         },
//       },
//       async ({ id }) => {
//         try {
//           chrome.system.display.overscanCalibrationComplete(id);

//           return this.formatSuccess('Overscan calibration completed', { id });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerShowNativeTouchCalibration(): void {
//     this.server.registerTool(
//       'show_native_touch_calibration',
//       {
//         description: 'Show native touch calibration for a display',
//         inputSchema: {
//           id: z.string().describe('The display ID to show touch calibration for'),
//         },
//       },
//       async ({ id }) => {
//         try {
//           await new Promise<void>((resolve, reject) => {
//             chrome.system.display.showNativeTouchCalibration(id, () => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve();
//               }
//             });
//           });

//           return this.formatSuccess('Native touch calibration shown', { id });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerStartCustomTouchCalibration(): void {
//     this.server.registerTool(
//       'start_custom_touch_calibration',
//       {
//         description: 'Start custom touch calibration for a display',
//         inputSchema: {
//           id: z.string().describe('The display ID to start touch calibration for'),
//         },
//       },
//       async ({ id }) => {
//         try {
//           chrome.system.display.startCustomTouchCalibration(id);

//           return this.formatSuccess('Custom touch calibration started', { id });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerCompleteCustomTouchCalibration(): void {
//     this.server.registerTool(
//       'complete_custom_touch_calibration',
//       {
//         description: 'Complete custom touch calibration with touch pairs',
//         inputSchema: {
//           pairs: z
//             .array(
//               z.object({
//                 displayPoint: z.object({
//                   x: z.number(),
//                   y: z.number(),
//                 }),
//                 touchPoint: z.object({
//                   x: z.number(),
//                   y: z.number(),
//                 }),
//               })
//             )
//             .describe('Array of display point to touch point pairs for calibration'),
//           bounds: z
//             .object({
//               left: z.number(),
//               top: z.number(),
//               width: z.number(),
//               height: z.number(),
//             })
//             .describe('Bounds of the display'),
//         },
//       },
//       async ({ pairs, bounds }) => {
//         try {
//           // @ts-expect-error - TODO: fix this
//           chrome.system.display.completeCustomTouchCalibration(pairs, bounds);

//           return this.formatSuccess('Custom touch calibration completed', {
//             pairsCount: pairs.length,
//             bounds,
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerClearTouchCalibration(): void {
//     this.server.registerTool(
//       'clear_touch_calibration',
//       {
//         description: 'Clear touch calibration for a display',
//         inputSchema: {
//           id: z.string().describe('The display ID to clear touch calibration for'),
//         },
//       },
//       async ({ id }) => {
//         try {
//           chrome.system.display.clearTouchCalibration(id);

//           return this.formatSuccess('Touch calibration cleared', { id });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerSetDisplayLayout(): void {
//     this.server.registerTool(
//       'set_display_layout',
//       {
//         description: 'Set the layout of displays',
//         inputSchema: {
//           layouts: z
//             .array(
//               z.object({
//                 id: z.string(),
//                 parentId: z.string().optional(),
//                 position: z.enum(['top', 'right', 'bottom', 'left']),
//                 offset: z.number(),
//               })
//             )
//             .describe('Array of display layout configurations'),
//         },
//       },
//       async ({ layouts }) => {
//         try {
//           await new Promise<void>((resolve, reject) => {
//             chrome.system.display.setDisplayLayout(
//               layouts as chrome.system.display.DisplayLayout[],
//               () => {
//                 if (chrome.runtime.lastError) {
//                   reject(new Error(chrome.runtime.lastError.message));
//                 } else {
//                   resolve();
//                 }
//               }
//             );
//           });

//           return this.formatSuccess('Display layout set successfully', {
//             layoutsCount: layouts.length,
//             layouts,
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerEnableUnifiedDesktop(): void {
//     this.server.registerTool(
//       'enable_unified_desktop',
//       {
//         description: 'Enable or disable unified desktop mode',
//         inputSchema: {
//           enabled: z.boolean().describe('Whether to enable unified desktop mode'),
//         },
//       },
//       async ({ enabled }) => {
//         try {
//           chrome.system.display.enableUnifiedDesktop(enabled);

//           return this.formatSuccess('Unified desktop mode updated', { enabled });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }
// }
