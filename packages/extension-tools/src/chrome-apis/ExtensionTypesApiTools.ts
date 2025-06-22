// import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// import { z } from 'zod';
// import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

// export interface ExtensionTypesApiToolsOptions {
//   validateImageDetails?: boolean;
//   validateInjectDetails?: boolean;
//   validateDeleteInjectionDetails?: boolean;
//   getImageFormats?: boolean;
//   getRunAtOptions?: boolean;
//   getCSSOrigins?: boolean;
//   getExecutionWorlds?: boolean;
//   getDocumentLifecycles?: boolean;
//   getFrameTypes?: boolean;
// }

// export class ExtensionTypesApiTools extends BaseApiTools {
//   protected apiName = 'ExtensionTypes';

//   constructor(
//     server: McpServer,
//     options: ExtensionTypesApiToolsOptions = {}
//   ) {
//     super(server, options);
//   }

//   checkAvailability(): ApiAvailability {
//     try {
//       // Check if API exists
//       if (!chrome.extensionTypes) {
//         return {
//           available: false,
//           message: 'chrome.extensionTypes API is not defined',
//           details: 'This API contains type declarations and should be available in all extension contexts',
//         };
//       }

//       // ExtensionTypes is primarily a type declaration namespace
//       // Check if we can access the namespace
//       if (typeof chrome.extensionTypes !== 'object') {
//         return {
//           available: false,
//           message: 'chrome.extensionTypes is not accessible',
//           details: 'The extensionTypes API appears to be unavailable',
//         };
//       }

//       return {
//         available: true,
//         message: 'ExtensionTypes API is available',
//       };
//     } catch (error) {
//       return {
//         available: false,
//         message: 'Failed to access chrome.extensionTypes API',
//         details: error instanceof Error ? error.message : 'Unknown error occurred',
//       };
//     }
//   }

//   registerTools(): void {
//     if (this.shouldRegisterTool('validateImageDetails')) {
//       this.registerValidateImageDetails();
//     }

//     if (this.shouldRegisterTool('validateInjectDetails')) {
//       this.registerValidateInjectDetails();
//     }

//     if (this.shouldRegisterTool('validateDeleteInjectionDetails')) {
//       this.registerValidateDeleteInjectionDetails();
//     }

//     if (this.shouldRegisterTool('getImageFormats')) {
//       this.registerGetImageFormats();
//     }

//     if (this.shouldRegisterTool('getRunAtOptions')) {
//       this.registerGetRunAtOptions();
//     }

//     if (this.shouldRegisterTool('getCSSOrigins')) {
//       this.registerGetCSSOrigins();
//     }

//     if (this.shouldRegisterTool('getExecutionWorlds')) {
//       this.registerGetExecutionWorlds();
//     }

//     if (this.shouldRegisterTool('getDocumentLifecycles')) {
//       this.registerGetDocumentLifecycles();
//     }

//     if (this.shouldRegisterTool('getFrameTypes')) {
//       this.registerGetFrameTypes();
//     }
//   }

//   private registerValidateImageDetails(): void {
//     this.server.registerTool(
//       'validate_image_details',
//       {
//         description: 'Validate ImageDetails object for image format and quality settings',
//         inputSchema: {
//           format: z
//             .enum(['jpeg', 'png'])
//             .optional()
//             .describe('The format of the resulting image. Default is "jpeg"'),
//           quality: z
//             .number()
//             .min(0)
//             .max(100)
//             .optional()
//             .describe(
//               'When format is "jpeg", controls the quality of the resulting image. This value is ignored for PNG images'
//             ),
//         },
//       },
//       async ({ format, quality }) => {
//         try {
//           const imageDetails: any = {};

//           if (format !== undefined) {
//             imageDetails.format = format;
//           }

//           if (quality !== undefined) {
//             if (format === 'png' && quality !== undefined) {
//               return this.formatSuccess('ImageDetails validated with warning', {
//                 imageDetails,
//                 warning: 'Quality parameter is ignored for PNG format',
//                 valid: true,
//               });
//             }
//             imageDetails.quality = quality;
//           }

//           return this.formatSuccess('ImageDetails validated successfully', {
//             imageDetails,
//             valid: true,
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerValidateInjectDetails(): void {
//     this.server.registerTool(
//       'validate_inject_details',
//       {
//         description: 'Validate InjectDetails object for script or CSS injection',
//         inputSchema: {
//           code: z.string().optional().describe('JavaScript or CSS code to inject'),
//           file: z.string().optional().describe('JavaScript or CSS file to inject'),
//           allFrames: z
//             .boolean()
//             .optional()
//             .describe(
//               'If true, inject into all frames of current page. Default is false (top frame only)'
//             ),
//           frameId: z
//             .number()
//             .optional()
//             .describe('The frame where the script or CSS should be injected. Defaults to 0'),
//           matchAboutBlank: z
//             .boolean()
//             .optional()
//             .describe(
//               'If true, also inject in about:blank and about:srcdoc frames if extension has access'
//             ),
//           runAt: z
//             .enum(['document_start', 'document_end', 'document_idle'])
//             .optional()
//             .describe('When the JavaScript or CSS will be injected. Defaults to "document_idle"'),
//           cssOrigin: z
//             .enum(['author', 'user'])
//             .optional()
//             .describe('The origin of the CSS to inject. Only for CSS, not JavaScript'),
//         },
//       },
//       async ({ code, file, allFrames, frameId, matchAboutBlank, runAt, cssOrigin }) => {
//         try {
//           // Validate that either code or file is provided, but not both
//           if (!code && !file) {
//             return this.formatError('Either code or file property must be set');
//           }

//           if (code && file) {
//             return this.formatError('Both code and file cannot be set at the same time');
//           }

//           const injectDetails: any = {};

//           if (code !== undefined) injectDetails.code = code;
//           if (file !== undefined) injectDetails.file = file;
//           if (allFrames !== undefined) injectDetails.allFrames = allFrames;
//           if (frameId !== undefined) injectDetails.frameId = frameId;
//           if (matchAboutBlank !== undefined) injectDetails.matchAboutBlank = matchAboutBlank;
//           if (runAt !== undefined) injectDetails.runAt = runAt;
//           if (cssOrigin !== undefined) injectDetails.cssOrigin = cssOrigin;

//           const warnings = [];
//           if (cssOrigin && code && code.trim().startsWith('function')) {
//             warnings.push('cssOrigin is specified but code appears to be JavaScript');
//           }

//           return this.formatSuccess('InjectDetails validated successfully', {
//             injectDetails,
//             valid: true,
//             warnings: warnings.length > 0 ? warnings : undefined,
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerValidateDeleteInjectionDetails(): void {
//     this.server.registerTool(
//       'validate_delete_injection_details',
//       {
//         description: 'Validate DeleteInjectionDetails object for CSS removal',
//         inputSchema: {
//           code: z.string().optional().describe('CSS code to remove'),
//           file: z.string().optional().describe('CSS file to remove'),
//           allFrames: z
//             .boolean()
//             .optional()
//             .describe(
//               'If true, remove CSS from all frames of current page. Default is false (top frame only)'
//             ),
//           frameId: z
//             .number()
//             .optional()
//             .describe('The frame from where the CSS should be removed. Defaults to 0'),
//           matchAboutBlank: z
//             .boolean()
//             .optional()
//             .describe(
//               'If true, also remove from about:blank and about:srcdoc frames if extension has access'
//             ),
//           cssOrigin: z
//             .enum(['author', 'user'])
//             .optional()
//             .describe('The origin of the CSS to remove. Defaults to "author"'),
//         },
//       },
//       async ({ code, file, allFrames, frameId, matchAboutBlank, cssOrigin }) => {
//         try {
//           // Validate that either code or file is provided, but not both
//           if (!code && !file) {
//             return this.formatError('Either code or file property must be set');
//           }

//           if (code && file) {
//             return this.formatError('Both code and file cannot be set at the same time');
//           }

//           const deleteDetails: any = {};

//           if (code !== undefined) deleteDetails.code = code;
//           if (file !== undefined) deleteDetails.file = file;
//           if (allFrames !== undefined) deleteDetails.allFrames = allFrames;
//           if (frameId !== undefined) deleteDetails.frameId = frameId;
//           if (matchAboutBlank !== undefined) deleteDetails.matchAboutBlank = matchAboutBlank;
//           if (cssOrigin !== undefined) deleteDetails.cssOrigin = cssOrigin;

//           return this.formatSuccess('DeleteInjectionDetails validated successfully', {
//             deleteDetails,
//             valid: true,
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerGetImageFormats(): void {
//     this.server.registerTool(
//       'get_image_formats',
//       {
//         description: 'Get available image formats for ImageDetails',
//         inputSchema: {},
//       },
//       async () => {
//         try {
//           return this.formatJson({
//             formats: [
//               {
//                 value: 'jpeg',
//                 description: 'JPEG format with quality control',
//                 supportsQuality: true,
//               },
//               {
//                 value: 'png',
//                 description: 'PNG format (quality parameter ignored)',
//                 supportsQuality: false,
//               },
//             ],
//             default: 'jpeg',
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerGetRunAtOptions(): void {
//     this.server.registerTool(
//       'get_run_at_options',
//       {
//         description: 'Get available RunAt options for script injection timing',
//         inputSchema: {},
//       },
//       async () => {
//         try {
//           return this.formatJson({
//             options: [
//               {
//                 value: 'document_start',
//                 description:
//                   'Script is injected after any files from css, but before any other DOM is constructed or any other script is run',
//               },
//               {
//                 value: 'document_end',
//                 description:
//                   'Script is injected immediately after the DOM is complete, but before subresources like images and frames have loaded',
//               },
//               {
//                 value: 'document_idle',
//                 description:
//                   'The browser chooses a time to inject the script between "document_end" and immediately after the window.onload event fires',
//               },
//             ],
//             default: 'document_idle',
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerGetCSSOrigins(): void {
//     this.server.registerTool(
//       'get_css_origins',
//       {
//         description: 'Get available CSS origin options for injection and removal',
//         inputSchema: {},
//       },
//       async () => {
//         try {
//           return this.formatJson({
//             origins: [
//               {
//                 value: 'author',
//                 description: 'Author stylesheet (default)',
//               },
//               {
//                 value: 'user',
//                 description: 'User stylesheet',
//               },
//             ],
//             default: 'author',
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerGetExecutionWorlds(): void {
//     this.server.registerTool(
//       'get_execution_worlds',
//       {
//         description: 'Get available execution worlds for script injection',
//         inputSchema: {},
//       },
//       async () => {
//         try {
//           return this.formatJson({
//             worlds: [
//               {
//                 value: 'ISOLATED',
//                 description: 'Isolated world unique to this extension',
//               },
//               {
//                 value: 'MAIN',
//                 description: 'Main world of the DOM shared with the page\'s JavaScript',
//               },
//               {
//                 value: 'USER_SCRIPT',
//                 description: 'User scripts world (only available for User Scripts API)',
//               },
//             ],
//             note: 'Available in Chrome 111+',
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerGetDocumentLifecycles(): void {
//     this.server.registerTool(
//       'get_document_lifecycles',
//       {
//         description: 'Get available document lifecycle states',
//         inputSchema: {},
//       },
//       async () => {
//         try {
//           return this.formatJson({
//             lifecycles: [
//               {
//                 value: 'prerender',
//                 description: 'Document is being prerendered',
//               },
//               {
//                 value: 'active',
//                 description: 'Document is active',
//               },
//               {
//                 value: 'cached',
//                 description: 'Document is cached',
//               },
//               {
//                 value: 'pending_deletion',
//                 description: 'Document is pending deletion',
//               },
//             ],
//             note: 'Available in Chrome 106+',
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerGetFrameTypes(): void {
//     this.server.registerTool(
//       'get_frame_types',
//       {
//         description: 'Get available frame types',
//         inputSchema: {},
//       },
//       async () => {
//         try {
//           return this.formatJson({
//             types: [
//               {
//                 value: 'outermost_frame',
//                 description: 'The outermost frame',
//               },
//               {
//                 value: 'fenced_frame',
//                 description: 'A fenced frame',
//               },
//               {
//                 value: 'sub_frame',
//                 description: 'A sub frame',
//               },
//             ],
//             note: 'Available in Chrome 106+',
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }
// }
