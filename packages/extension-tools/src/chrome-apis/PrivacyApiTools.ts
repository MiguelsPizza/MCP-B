// import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// import { z } from 'zod';
// import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

// export interface PrivacyApiToolsOptions {
//   getNetworkPredictionEnabled?: boolean;
//   setNetworkPredictionEnabled?: boolean;
//   getWebRTCIPHandlingPolicy?: boolean;
//   setWebRTCIPHandlingPolicy?: boolean;
//   getAlternateErrorPagesEnabled?: boolean;
//   setAlternateErrorPagesEnabled?: boolean;
//   getAutofillAddressEnabled?: boolean;
//   setAutofillAddressEnabled?: boolean;
//   getAutofillCreditCardEnabled?: boolean;
//   setAutofillCreditCardEnabled?: boolean;
//   getPasswordSavingEnabled?: boolean;
//   setPasswordSavingEnabled?: boolean;
//   getSafeBrowsingEnabled?: boolean;
//   setSafeBrowsingEnabled?: boolean;
//   getSafeBrowsingExtendedReportingEnabled?: boolean;
//   setSafeBrowsingExtendedReportingEnabled?: boolean;
//   getSearchSuggestEnabled?: boolean;
//   setSearchSuggestEnabled?: boolean;
//   getSpellingServiceEnabled?: boolean;
//   setSpellingServiceEnabled?: boolean;
//   getTranslationServiceEnabled?: boolean;
//   setTranslationServiceEnabled?: boolean;
//   getAdMeasurementEnabled?: boolean;
//   setAdMeasurementEnabled?: boolean;
//   getDoNotTrackEnabled?: boolean;
//   setDoNotTrackEnabled?: boolean;
//   getFledgeEnabled?: boolean;
//   setFledgeEnabled?: boolean;
//   getHyperlinkAuditingEnabled?: boolean;
//   setHyperlinkAuditingEnabled?: boolean;
//   getProtectedContentEnabled?: boolean;
//   setProtectedContentEnabled?: boolean;
//   getReferrersEnabled?: boolean;
//   setReferrersEnabled?: boolean;
//   getRelatedWebsiteSetsEnabled?: boolean;
//   setRelatedWebsiteSetsEnabled?: boolean;
//   getThirdPartyCookiesAllowed?: boolean;
//   setThirdPartyCookiesAllowed?: boolean;
//   getTopicsEnabled?: boolean;
//   setTopicsEnabled?: boolean;
// }

// export class PrivacyApiTools extends BaseApiTools {
//   protected apiName = 'Privacy';

//   constructor(
//     server: McpServer,
//     options: PrivacyApiToolsOptions = {}
//   ) {
//     super(server, options);
//   }

//   checkAvailability(): ApiAvailability {
//     try {
//       // Check if API exists
//       if (!chrome.privacy) {
//         return {
//           available: false,
//           message: 'chrome.privacy API is not defined',
//           details: 'This extension needs the "privacy" permission in its manifest.json',
//         };
//       }

//       // Test basic methods
//       if (!chrome.privacy.services || !chrome.privacy.network || !chrome.privacy.websites) {
//         return {
//           available: false,
//           message: 'chrome.privacy API is partially available',
//           details: 'The privacy API appears to be incomplete. Check manifest permissions.',
//         };
//       }

//       // Try to actually use the API
//       chrome.privacy.services.autofillCreditCardEnabled.get({}, (_details) => {
//         if (chrome.runtime.lastError) {
//           throw new Error(chrome.runtime.lastError.message);
//         }
//       });

//       return {
//         available: true,
//         message: 'Privacy API is fully available',
//       };
//     } catch (error) {
//       return {
//         available: false,
//         message: 'Failed to access chrome.privacy API',
//         details: error instanceof Error ? error.message : 'Unknown error occurred',
//       };
//     }
//   }

//   registerTools(): void {
//     if (this.shouldRegisterTool('getNetworkPredictionEnabled')) {
//       this.registerGetNetworkPredictionEnabled();
//     }

//     if (this.shouldRegisterTool('setNetworkPredictionEnabled')) {
//       this.registerSetNetworkPredictionEnabled();
//     }

//     if (this.shouldRegisterTool('getWebRTCIPHandlingPolicy')) {
//       this.registerGetWebRTCIPHandlingPolicy();
//     }

//     if (this.shouldRegisterTool('setWebRTCIPHandlingPolicy')) {
//       this.registerSetWebRTCIPHandlingPolicy();
//     }

//     if (this.shouldRegisterTool('getAlternateErrorPagesEnabled')) {
//       this.registerGetAlternateErrorPagesEnabled();
//     }

//     if (this.shouldRegisterTool('setAlternateErrorPagesEnabled')) {
//       this.registerSetAlternateErrorPagesEnabled();
//     }

//     if (this.shouldRegisterTool('getAutofillAddressEnabled')) {
//       this.registerGetAutofillAddressEnabled();
//     }

//     if (this.shouldRegisterTool('setAutofillAddressEnabled')) {
//       this.registerSetAutofillAddressEnabled();
//     }

//     if (this.shouldRegisterTool('getAutofillCreditCardEnabled')) {
//       this.registerGetAutofillCreditCardEnabled();
//     }

//     if (this.shouldRegisterTool('setAutofillCreditCardEnabled')) {
//       this.registerSetAutofillCreditCardEnabled();
//     }

//     if (this.shouldRegisterTool('getPasswordSavingEnabled')) {
//       this.registerGetPasswordSavingEnabled();
//     }

//     if (this.shouldRegisterTool('setPasswordSavingEnabled')) {
//       this.registerSetPasswordSavingEnabled();
//     }

//     if (this.shouldRegisterTool('getSafeBrowsingEnabled')) {
//       this.registerGetSafeBrowsingEnabled();
//     }

//     if (this.shouldRegisterTool('setSafeBrowsingEnabled')) {
//       this.registerSetSafeBrowsingEnabled();
//     }

//     if (this.shouldRegisterTool('getSafeBrowsingExtendedReportingEnabled')) {
//       this.registerGetSafeBrowsingExtendedReportingEnabled();
//     }

//     if (this.shouldRegisterTool('setSafeBrowsingExtendedReportingEnabled')) {
//       this.registerSetSafeBrowsingExtendedReportingEnabled();
//     }

//     if (this.shouldRegisterTool('getSearchSuggestEnabled')) {
//       this.registerGetSearchSuggestEnabled();
//     }

//     if (this.shouldRegisterTool('setSearchSuggestEnabled')) {
//       this.registerSetSearchSuggestEnabled();
//     }

//     if (this.shouldRegisterTool('getSpellingServiceEnabled')) {
//       this.registerGetSpellingServiceEnabled();
//     }

//     if (this.shouldRegisterTool('setSpellingServiceEnabled')) {
//       this.registerSetSpellingServiceEnabled();
//     }

//     if (this.shouldRegisterTool('getTranslationServiceEnabled')) {
//       this.registerGetTranslationServiceEnabled();
//     }

//     if (this.shouldRegisterTool('setTranslationServiceEnabled')) {
//       this.registerSetTranslationServiceEnabled();
//     }

//     if (this.shouldRegisterTool('getAdMeasurementEnabled')) {
//       this.registerGetAdMeasurementEnabled();
//     }

//     if (this.shouldRegisterTool('setAdMeasurementEnabled')) {
//       this.registerSetAdMeasurementEnabled();
//     }

//     if (this.shouldRegisterTool('getDoNotTrackEnabled')) {
//       this.registerGetDoNotTrackEnabled();
//     }

//     if (this.shouldRegisterTool('setDoNotTrackEnabled')) {
//       this.registerSetDoNotTrackEnabled();
//     }

//     if (this.shouldRegisterTool('getFledgeEnabled')) {
//       this.registerGetFledgeEnabled();
//     }

//     if (this.shouldRegisterTool('setFledgeEnabled')) {
//       this.registerSetFledgeEnabled();
//     }

//     if (this.shouldRegisterTool('getHyperlinkAuditingEnabled')) {
//       this.registerGetHyperlinkAuditingEnabled();
//     }

//     if (this.shouldRegisterTool('setHyperlinkAuditingEnabled')) {
//       this.registerSetHyperlinkAuditingEnabled();
//     }

//     if (this.shouldRegisterTool('getProtectedContentEnabled')) {
//       this.registerGetProtectedContentEnabled();
//     }

//     if (this.shouldRegisterTool('setProtectedContentEnabled')) {
//       this.registerSetProtectedContentEnabled();
//     }

//     if (this.shouldRegisterTool('getReferrersEnabled')) {
//       this.registerGetReferrersEnabled();
//     }

//     if (this.shouldRegisterTool('setReferrersEnabled')) {
//       this.registerSetReferrersEnabled();
//     }

//     if (this.shouldRegisterTool('getRelatedWebsiteSetsEnabled')) {
//       this.registerGetRelatedWebsiteSetsEnabled();
//     }

//     if (this.shouldRegisterTool('setRelatedWebsiteSetsEnabled')) {
//       this.registerSetRelatedWebsiteSetsEnabled();
//     }

//     if (this.shouldRegisterTool('getThirdPartyCookiesAllowed')) {
//       this.registerGetThirdPartyCookiesAllowed();
//     }

//     if (this.shouldRegisterTool('setThirdPartyCookiesAllowed')) {
//       this.registerSetThirdPartyCookiesAllowed();
//     }

//     if (this.shouldRegisterTool('getTopicsEnabled')) {
//       this.registerGetTopicsEnabled();
//     }

//     if (this.shouldRegisterTool('setTopicsEnabled')) {
//       this.registerSetTopicsEnabled();
//     }
//   }

//   private registerGetNetworkPredictionEnabled(): void {
//     this.server.registerTool(
//       'get_network_prediction_enabled',
//       {
//         description: 'Get the current state of network prediction (DNS pre-resolution and preemptive connections)',
//         inputSchema: {
//           incognito: z.boolean().optional().describe('Whether to get the setting for incognito mode'),
//         },
//       },
//       async ({ incognito }) => {
//         try {
//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.network.networkPredictionEnabled.get({ incognito: incognito || false }, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           return this.formatJson({
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

//   private registerSetNetworkPredictionEnabled(): void {
//     this.server.registerTool(
//       'set_network_prediction_enabled',
//       {
//         description: 'Enable or disable network prediction (DNS pre-resolution and preemptive connections)',
//         inputSchema: {
//           value: z.boolean().describe('Whether to enable network prediction'),
//           scope: z.enum(['regular', 'regular_only', 'incognito_persistent', 'incognito_session_only']).optional().describe('The scope of the setting'),
//         },
//       },
//       async ({ value, scope }) => {
//         try {
//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.network.networkPredictionEnabled.get({}, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           if (details.levelOfControl !== 'controllable_by_this_extension') {
//             return this.formatError(`Cannot control this setting. Level of control: ${details.levelOfControl}`);
//           }

//           await new Promise<void>((resolve, reject) => {
//             const setDetails: chrome.types.ChromeSettingSetDetails = { value };
//             if (scope) setDetails.scope = scope;

//             chrome.privacy.network.networkPredictionEnabled.set(setDetails, () => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve();
//               }
//             });
//           });

//           return this.formatSuccess('Network prediction setting updated successfully', { value });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerGetWebRTCIPHandlingPolicy(): void {
//     this.server.registerTool(
//       'get_webrtc_ip_handling_policy',
//       {
//         description: 'Get the current WebRTC IP handling policy',
//         inputSchema: {
//           incognito: z.boolean().optional().describe('Whether to get the setting for incognito mode'),
//         },
//       },
//       async ({ incognito }) => {
//         try {
//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.network.webRTCIPHandlingPolicy.get({ incognito: incognito || false }, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           return this.formatJson({
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

//   private registerSetWebRTCIPHandlingPolicy(): void {
//     this.server.registerTool(
//       'set_webrtc_ip_handling_policy',
//       {
//         description: 'Set the WebRTC IP handling policy',
//         inputSchema: {
//           value: z.enum(['default', 'default_public_and_private_interfaces', 'default_public_interface_only', 'disable_non_proxied_udp']).describe('The IP handling policy'),
//           scope: z.enum(['regular', 'regular_only', 'incognito_persistent', 'incognito_session_only']).optional().describe('The scope of the setting'),
//         },
//       },
//       async ({ value, scope }) => {
//         try {
//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.network.webRTCIPHandlingPolicy.get({}, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           if (details.levelOfControl !== 'controllable_by_this_extension') {
//             return this.formatError(`Cannot control this setting. Level of control: ${details.levelOfControl}`);
//           }

//           await new Promise<void>((resolve, reject) => {
//             const setDetails: chrome.types.ChromeSettingSetDetails = { value };
//             if (scope) setDetails.scope = scope;

//             chrome.privacy.network.webRTCIPHandlingPolicy.set(setDetails, () => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve();
//               }
//             });
//           });

//           return this.formatSuccess('WebRTC IP handling policy updated successfully', { value });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerGetAlternateErrorPagesEnabled(): void {
//     this.server.registerTool(
//       'get_alternate_error_pages_enabled',
//       {
//         description: 'Get whether alternate error pages are enabled',
//         inputSchema: {
//           incognito: z.boolean().optional().describe('Whether to get the setting for incognito mode'),
//         },
//       },
//       async ({ incognito }) => {
//         try {
//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.services.alternateErrorPagesEnabled.get({ incognito: incognito || false }, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           return this.formatJson({
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

//   private registerSetAlternateErrorPagesEnabled(): void {
//     this.server.registerTool(
//       'set_alternate_error_pages_enabled',
//       {
//         description: 'Enable or disable alternate error pages',
//         inputSchema: {
//           value: z.boolean().describe('Whether to enable alternate error pages'),
//           scope: z.enum(['regular', 'regular_only', 'incognito_persistent', 'incognito_session_only']).optional().describe('The scope of the setting'),
//         },
//       },
//       async ({ value, scope }) => {
//         try {
//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.services.alternateErrorPagesEnabled.get({}, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           if (details.levelOfControl !== 'controllable_by_this_extension') {
//             return this.formatError(`Cannot control this setting. Level of control: ${details.levelOfControl}`);
//           }

//           await new Promise<void>((resolve, reject) => {
//             const setDetails: chrome.types.ChromeSettingSetDetails = { value };
//             if (scope) setDetails.scope = scope;

//             chrome.privacy.services.alternateErrorPagesEnabled.set(setDetails, () => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve();
//               }
//             });
//           });

//           return this.formatSuccess('Alternate error pages setting updated successfully', { value });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerGetAutofillAddressEnabled(): void {
//     this.server.registerTool(
//       'get_autofill_address_enabled',
//       {
//         description: 'Get whether autofill for addresses is enabled',
//         inputSchema: {
//           incognito: z.boolean().optional().describe('Whether to get the setting for incognito mode'),
//         },
//       },
//       async ({ incognito }) => {
//         try {
//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.services.autofillAddressEnabled.get({ incognito: incognito || false }, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           return this.formatJson({
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

//   private registerSetAutofillAddressEnabled(): void {
//     this.server.registerTool(
//       'set_autofill_address_enabled',
//       {
//         description: 'Enable or disable autofill for addresses',
//         inputSchema: {
//           value: z.boolean().describe('Whether to enable autofill for addresses'),
//           scope: z.enum(['regular', 'regular_only', 'incognito_persistent', 'incognito_session_only']).optional().describe('The scope of the setting'),
//         },
//       },
//       async ({ value, scope }) => {
//         try {
//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.services.autofillAddressEnabled.get({}, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           if (details.levelOfControl !== 'controllable_by_this_extension') {
//             return this.formatError(`Cannot control this setting. Level of control: ${details.levelOfControl}`);
//           }

//           await new Promise<void>((resolve, reject) => {
//             const setDetails: chrome.types.ChromeSettingSetDetails = { value };
//             if (scope) setDetails.scope = scope;

//             chrome.privacy.services.autofillAddressEnabled.set(setDetails, () => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve();
//               }
//             });
//           });

//           return this.formatSuccess('Autofill address setting updated successfully', { value });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerGetAutofillCreditCardEnabled(): void {
//     this.server.registerTool(
//       'get_autofill_credit_card_enabled',
//       {
//         description: 'Get whether autofill for credit cards is enabled',
//         inputSchema: {
//           incognito: z.boolean().optional().describe('Whether to get the setting for incognito mode'),
//         },
//       },
//       async ({ incognito }) => {
//         try {
//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.services.autofillCreditCardEnabled.get({ incognito: incognito || false }, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           return this.formatJson({
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

//   private registerSetAutofillCreditCardEnabled(): void {
//     this.server.registerTool(
//       'set_autofill_credit_card_enabled',
//       {
//         description: 'Enable or disable autofill for credit cards',
//         inputSchema: {
//           value: z.boolean().describe('Whether to enable autofill for credit cards'),
//           scope: z.enum(['regular', 'regular_only', 'incognito_persistent', 'incognito_session_only']).optional().describe('The scope of the setting'),
//         },
//       },
//       async ({ value, scope }) => {
//         try {
//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.services.autofillCreditCardEnabled.get({}, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           if (details.levelOfControl !== 'controllable_by_this_extension') {
//             return this.formatError(`Cannot control this setting. Level of control: ${details.levelOfControl}`);
//           }

//           await new Promise<void>((resolve, reject) => {
//             const setDetails: chrome.types.ChromeSettingSetDetails = { value };
//             if (scope) setDetails.scope = scope;

//             chrome.privacy.services.autofillCreditCardEnabled.set(setDetails, () => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve();
//               }
//             });
//           });

//           return this.formatSuccess('Autofill credit card setting updated successfully', { value });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerGetPasswordSavingEnabled(): void {
//     this.server.registerTool(
//       'get_password_saving_enabled',
//       {
//         description: 'Get whether password saving is enabled',
//         inputSchema: {
//           incognito: z.boolean().optional().describe('Whether to get the setting for incognito mode'),
//         },
//       },
//       async ({ incognito }) => {
//         try {
//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.services.passwordSavingEnabled.get({ incognito: incognito || false }, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           return this.formatJson({
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

//   private registerSetPasswordSavingEnabled(): void {
//     this.server.registerTool(
//       'set_password_saving_enabled',
//       {
//         description: 'Enable or disable password saving',
//         inputSchema: {
//           value: z.boolean().describe('Whether to enable password saving'),
//           scope: z.enum(['regular', 'regular_only', 'incognito_persistent', 'incognito_session_only']).optional().describe('The scope of the setting'),
//         },
//       },
//       async ({ value, scope }) => {
//         try {
//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.services.passwordSavingEnabled.get({}, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           if (details.levelOfControl !== 'controllable_by_this_extension') {
//             return this.formatError(`Cannot control this setting. Level of control: ${details.levelOfControl}`);
//           }

//           await new Promise<void>((resolve, reject) => {
//             const setDetails: chrome.types.ChromeSettingSetDetails = { value };
//             if (scope) setDetails.scope = scope;

//             chrome.privacy.services.passwordSavingEnabled.set(setDetails, () => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve();
//               }
//             });
//           });

//           return this.formatSuccess('Password saving setting updated successfully', { value });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerGetSafeBrowsingEnabled(): void {
//     this.server.registerTool(
//       'get_safe_browsing_enabled',
//       {
//         description: 'Get whether Safe Browsing is enabled',
//         inputSchema: {
//           incognito: z.boolean().optional().describe('Whether to get the setting for incognito mode'),
//         },
//       },
//       async ({ incognito }) => {
//         try {
//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.services.safeBrowsingEnabled.get({ incognito: incognito || false }, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           return this.formatJson({
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

//   private registerSetSafeBrowsingEnabled(): void {
//     this.server.registerTool(
//       'set_safe_browsing_enabled',
//       {
//         description: 'Enable or disable Safe Browsing',
//         inputSchema: {
//           value: z.boolean().describe('Whether to enable Safe Browsing'),
//           scope: z.enum(['regular', 'regular_only', 'incognito_persistent', 'incognito_session_only']).optional().describe('The scope of the setting'),
//         },
//       },
//       async ({ value, scope }) => {
//         try {
//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.services.safeBrowsingEnabled.get({}, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           if (details.levelOfControl !== 'controllable_by_this_extension') {
//             return this.formatError(`Cannot control this setting. Level of control: ${details.levelOfControl}`);
//           }

//           await new Promise<void>((resolve, reject) => {
//             const setDetails: chrome.types.ChromeSettingSetDetails = { value };
//             if (scope) setDetails.scope = scope;

//             chrome.privacy.services.safeBrowsingEnabled.set(setDetails, () => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve();
//               }
//             });
//           });

//           return this.formatSuccess('Safe Browsing setting updated successfully', { value });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerGetSafeBrowsingExtendedReportingEnabled(): void {
//     this.server.registerTool(
//       'get_safe_browsing_extended_reporting_enabled',
//       {
//         description: 'Get whether Safe Browsing extended reporting is enabled',
//         inputSchema: {
//           incognito: z.boolean().optional().describe('Whether to get the setting for incognito mode'),
//         },
//       },
//       async ({ incognito }) => {
//         try {
//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.services.safeBrowsingExtendedReportingEnabled.get({ incognito: incognito || false }, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           return this.formatJson({
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

//   private registerSetSafeBrowsingExtendedReportingEnabled(): void {
//     this.server.registerTool(
//       'set_safe_browsing_extended_reporting_enabled',
//       {
//         description: 'Enable or disable Safe Browsing extended reporting',
//         inputSchema: {
//           value: z.boolean().describe('Whether to enable Safe Browsing extended reporting'),
//           scope: z.enum(['regular', 'regular_only', 'incognito_persistent', 'incognito_session_only']).optional().describe('The scope of the setting'),
//         },
//       },
//       async ({ value, scope }) => {
//         try {
//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.services.safeBrowsingExtendedReportingEnabled.get({}, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           if (details.levelOfControl !== 'controllable_by_this_extension') {
//             return this.formatError(`Cannot control this setting. Level of control: ${details.levelOfControl}`);
//           }

//           await new Promise<void>((resolve, reject) => {
//             const setDetails: chrome.types.ChromeSettingSetDetails = { value };
//             if (scope) setDetails.scope = scope;

//             chrome.privacy.services.safeBrowsingExtendedReportingEnabled.set(setDetails, () => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve();
//               }
//             });
//           });

//           return this.formatSuccess('Safe Browsing extended reporting setting updated successfully', { value });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerGetSearchSuggestEnabled(): void {
//     this.server.registerTool(
//       'get_search_suggest_enabled',
//       {
//         description: 'Get whether search suggestions are enabled',
//         inputSchema: {
//           incognito: z.boolean().optional().describe('Whether to get the setting for incognito mode'),
//         },
//       },
//       async ({ incognito }) => {
//         try {
//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.services.searchSuggestEnabled.get({ incognito: incognito || false }, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           return this.formatJson({
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

//   private registerSetSearchSuggestEnabled(): void {
//     this.server.registerTool(
//       'set_search_suggest_enabled',
//       {
//         description: 'Enable or disable search suggestions',
//         inputSchema: {
//           value: z.boolean().describe('Whether to enable search suggestions'),
//           scope: z.enum(['regular', 'regular_only', 'incognito_persistent', 'incognito_session_only']).optional().describe('The scope of the setting'),
//         },
//       },
//       async ({ value, scope }) => {
//         try {
//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.services.searchSuggestEnabled.get({}, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           if (details.levelOfControl !== 'controllable_by_this_extension') {
//             return this.formatError(`Cannot control this setting. Level of control: ${details.levelOfControl}`);
//           }

//           await new Promise<void>((resolve, reject) => {
//             const setDetails: chrome.types.ChromeSettingSetDetails = { value };
//             if (scope) setDetails.scope = scope;

//             chrome.privacy.services.searchSuggestEnabled.set(setDetails, () => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve();
//               }
//             });
//           });

//           return this.formatSuccess('Search suggestions setting updated successfully', { value });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerGetSpellingServiceEnabled(): void {
//     this.server.registerTool(
//       'get_spelling_service_enabled',
//       {
//         description: 'Get whether the spelling service is enabled',
//         inputSchema: {
//           incognito: z.boolean().optional().describe('Whether to get the setting for incognito mode'),
//         },
//       },
//       async ({ incognito }) => {
//         try {
//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.services.spellingServiceEnabled.get({ incognito: incognito || false }, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           return this.formatJson({
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

//   private registerSetSpellingServiceEnabled(): void {
//     this.server.registerTool(
//       'set_spelling_service_enabled',
//       {
//         description: 'Enable or disable the spelling service',
//         inputSchema: {
//           value: z.boolean().describe('Whether to enable the spelling service'),
//           scope: z.enum(['regular', 'regular_only', 'incognito_persistent', 'incognito_session_only']).optional().describe('The scope of the setting'),
//         },
//       },
//       async ({ value, scope }) => {
//         try {
//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.services.spellingServiceEnabled.get({}, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           if (details.levelOfControl !== 'controllable_by_this_extension') {
//             return this.formatError(`Cannot control this setting. Level of control: ${details.levelOfControl}`);
//           }

//           await new Promise<void>((resolve, reject) => {
//             const setDetails: chrome.types.ChromeSettingSetDetails = { value };
//             if (scope) setDetails.scope = scope;

//             chrome.privacy.services.spellingServiceEnabled.set(setDetails, () => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve();
//               }
//             });
//           });

//           return this.formatSuccess('Spelling service setting updated successfully', { value });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerGetTranslationServiceEnabled(): void {
//     this.server.registerTool(
//       'get_translation_service_enabled',
//       {
//         description: 'Get whether the translation service is enabled',
//         inputSchema: {
//           incognito: z.boolean().optional().describe('Whether to get the setting for incognito mode'),
//         },
//       },
//       async ({ incognito }) => {
//         try {
//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.services.translationServiceEnabled.get({ incognito: incognito || false }, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           return this.formatJson({
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

//   private registerSetTranslationServiceEnabled(): void {
//     this.server.registerTool(
//       'set_translation_service_enabled',
//       {
//         description: 'Enable or disable the translation service',
//         inputSchema: {
//           value: z.boolean().describe('Whether to enable the translation service'),
//           scope: z.enum(['regular', 'regular_only', 'incognito_persistent', 'incognito_session_only']).optional().describe('The scope of the setting'),
//         },
//       },
//       async ({ value, scope }) => {
//         try {
//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.services.translationServiceEnabled.get({}, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           if (details.levelOfControl !== 'controllable_by_this_extension') {
//             return this.formatError(`Cannot control this setting. Level of control: ${details.levelOfControl}`);
//           }

//           await new Promise<void>((resolve, reject) => {
//             const setDetails: chrome.types.ChromeSettingSetDetails = { value };
//             if (scope) setDetails.scope = scope;

//             chrome.privacy.services.translationServiceEnabled.set(setDetails, () => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve();
//               }
//             });
//           });

//           return this.formatSuccess('Translation service setting updated successfully', { value });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerGetAdMeasurementEnabled(): void {
//     this.server.registerTool(
//       'get_ad_measurement_enabled',
//       {
//         description: 'Get whether ad measurement APIs are enabled',
//         inputSchema: {
//           incognito: z.boolean().optional().describe('Whether to get the setting for incognito mode'),
//         },
//       },
//       async ({ incognito }) => {
//         try {
//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.websites.adMeasurementEnabled.get({ incognito: incognito || false }, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           return this.formatJson({
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

//   private registerSetAdMeasurementEnabled(): void {
//     this.server.registerTool(
//       'set_ad_measurement_enabled',
//       {
//         description: 'Enable or disable ad measurement APIs (can only be disabled)',
//         inputSchema: {
//           value: z.boolean().describe('Whether to enable ad measurement APIs (only false is allowed)'),
//           scope: z.enum(['regular', 'regular_only', 'incognito_persistent', 'incognito_session_only']).optional().describe('The scope of the setting'),
//         },
//       },
//       async ({ value, scope }) => {
//         try {
//           if (value === true) {
//             return this.formatError('Ad measurement APIs can only be disabled, not enabled');
//           }

//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.websites.adMeasurementEnabled.get({}, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           if (details.levelOfControl !== 'controllable_by_this_extension') {
//             return this.formatError(`Cannot control this setting. Level of control: ${details.levelOfControl}`);
//           }

//           await new Promise<void>((resolve, reject) => {
//             const setDetails: chrome.types.ChromeSettingSetDetails = { value };
//             if (scope) setDetails.scope = scope;

//             chrome.privacy.websites.adMeasurementEnabled.set(setDetails, () => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve();
//               }
//             });
//           });

//           return this.formatSuccess('Ad measurement setting updated successfully', { value });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerGetDoNotTrackEnabled(): void {
//     this.server.registerTool(
//       'get_do_not_track_enabled',
//       {
//         description: 'Get whether Do Not Track is enabled',
//         inputSchema: {
//           incognito: z.boolean().optional().describe('Whether to get the setting for incognito mode'),
//         },
//       },
//       async ({ incognito }) => {
//         try {
//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.websites.doNotTrackEnabled.get({ incognito: incognito || false }, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           return this.formatJson({
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

//   private registerSetDoNotTrackEnabled(): void {
//     this.server.registerTool(
//       'set_do_not_track_enabled',
//       {
//         description: 'Enable or disable Do Not Track',
//         inputSchema: {
//           value: z.boolean().describe('Whether to enable Do Not Track'),
//           scope: z.enum(['regular', 'regular_only', 'incognito_persistent', 'incognito_session_only']).optional().describe('The scope of the setting'),
//         },
//       },
//       async ({ value, scope }) => {
//         try {
//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.websites.doNotTrackEnabled.get({}, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           if (details.levelOfControl !== 'controllable_by_this_extension') {
//             return this.formatError(`Cannot control this setting. Level of control: ${details.levelOfControl}`);
//           }

//           await new Promise<void>((resolve, reject) => {
//             const setDetails: chrome.types.ChromeSettingSetDetails = { value };
//             if (scope) setDetails.scope = scope;

//             chrome.privacy.websites.doNotTrackEnabled.set(setDetails, () => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve();
//               }
//             });
//           });

//           return this.formatSuccess('Do Not Track setting updated successfully', { value });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerGetFledgeEnabled(): void {
//     this.server.registerTool(
//       'get_fledge_enabled',
//       {
//         description: 'Get whether the Fledge API is enabled',
//         inputSchema: {
//           incognito: z.boolean().optional().describe('Whether to get the setting for incognito mode'),
//         },
//       },
//       async ({ incognito }) => {
//         try {
//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.websites.fledgeEnabled.get({ incognito: incognito || false }, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           return this.formatJson({
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

//   private registerSetFledgeEnabled(): void {
//     this.server.registerTool(
//       'set_fledge_enabled',
//       {
//         description: 'Enable or disable the Fledge API (can only be disabled)',
//         inputSchema: {
//           value: z.boolean().describe('Whether to enable the Fledge API (only false is allowed)'),
//           scope: z.enum(['regular', 'regular_only', 'incognito_persistent', 'incognito_session_only']).optional().describe('The scope of the setting'),
//         },
//       },
//       async ({ value, scope }) => {
//         try {
//           if (value === true) {
//             return this.formatError('Fledge API can only be disabled, not enabled');
//           }

//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.websites.fledgeEnabled.get({}, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           if (details.levelOfControl !== 'controllable_by_this_extension') {
//             return this.formatError(`Cannot control this setting. Level of control: ${details.levelOfControl}`);
//           }

//           await new Promise<void>((resolve, reject) => {
//             const setDetails: chrome.types.ChromeSettingSetDetails = { value };
//             if (scope) setDetails.scope = scope;

//             chrome.privacy.websites.fledgeEnabled.set(setDetails, () => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve();
//               }
//             });
//           });

//           return this.formatSuccess('Fledge API setting updated successfully', { value });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerGetHyperlinkAuditingEnabled(): void {
//     this.server.registerTool(
//       'get_hyperlink_auditing_enabled',
//       {
//         description: 'Get whether hyperlink auditing is enabled',
//         inputSchema: {
//           incognito: z.boolean().optional().describe('Whether to get the setting for incognito mode'),
//         },
//       },
//       async ({ incognito }) => {
//         try {
//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.websites.hyperlinkAuditingEnabled.get({ incognito: incognito || false }, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           return this.formatJson({
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

//   private registerSetHyperlinkAuditingEnabled(): void {
//     this.server.registerTool(
//       'set_hyperlink_auditing_enabled',
//       {
//         description: 'Enable or disable hyperlink auditing',
//         inputSchema: {
//           value: z.boolean().describe('Whether to enable hyperlink auditing'),
//           scope: z.enum(['regular', 'regular_only', 'incognito_persistent', 'incognito_session_only']).optional().describe('The scope of the setting'),
//         },
//       },
//       async ({ value, scope }) => {
//         try {
//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.websites.hyperlinkAuditingEnabled.get({}, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           if (details.levelOfControl !== 'controllable_by_this_extension') {
//             return this.formatError(`Cannot control this setting. Level of control: ${details.levelOfControl}`);
//           }

//           await new Promise<void>((resolve, reject) => {
//             const setDetails: chrome.types.ChromeSettingSetDetails = { value };
//             if (scope) setDetails.scope = scope;

//             chrome.privacy.websites.hyperlinkAuditingEnabled.set(setDetails, () => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve();
//               }
//             });
//           });

//           return this.formatSuccess('Hyperlink auditing setting updated successfully', { value });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerGetProtectedContentEnabled(): void {
//     this.server.registerTool(
//       'get_protected_content_enabled',
//       {
//         description: 'Get whether protected content is enabled (Windows and ChromeOS only)',
//         inputSchema: {
//           incognito: z.boolean().optional().describe('Whether to get the setting for incognito mode'),
//         },
//       },
//       async ({ incognito }) => {
//         try {
//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.websites.protectedContentEnabled.get({ incognito: incognito || false }, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           return this.formatJson({
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

//   private registerSetProtectedContentEnabled(): void {
//     this.server.registerTool(
//       'set_protected_content_enabled',
//       {
//         description: 'Enable or disable protected content (Windows and ChromeOS only)',
//         inputSchema: {
//           value: z.boolean().describe('Whether to enable protected content'),
//           scope: z.enum(['regular', 'regular_only', 'incognito_persistent', 'incognito_session_only']).optional().describe('The scope of the setting'),
//         },
//       },
//       async ({ value, scope }) => {
//         try {
//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.websites.protectedContentEnabled.get({}, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           if (details.levelOfControl !== 'controllable_by_this_extension') {
//             return this.formatError(`Cannot control this setting. Level of control: ${details.levelOfControl}`);
//           }

//           await new Promise<void>((resolve, reject) => {
//             const setDetails: chrome.types.ChromeSettingSetDetails = { value };
//             if (scope) setDetails.scope = scope;

//             chrome.privacy.websites.protectedContentEnabled.set(setDetails, () => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve();
//               }
//             });
//           });

//           return this.formatSuccess('Protected content setting updated successfully', { value });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerGetReferrersEnabled(): void {
//     this.server.registerTool(
//       'get_referrers_enabled',
//       {
//         description: 'Get whether referrer headers are enabled',
//         inputSchema: {
//           incognito: z.boolean().optional().describe('Whether to get the setting for incognito mode'),
//         },
//       },
//       async ({ incognito }) => {
//         try {
//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.websites.referrersEnabled.get({ incognito: incognito || false }, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           return this.formatJson({
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

//   private registerSetReferrersEnabled(): void {
//     this.server.registerTool(
//       'set_referrers_enabled',
//       {
//         description: 'Enable or disable referrer headers',
//         inputSchema: {
//           value: z.boolean().describe('Whether to enable referrer headers'),
//           scope: z.enum(['regular', 'regular_only', 'incognito_persistent', 'incognito_session_only']).optional().describe('The scope of the setting'),
//         },
//       },
//       async ({ value, scope }) => {
//         try {
//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.websites.referrersEnabled.get({}, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           if (details.levelOfControl !== 'controllable_by_this_extension') {
//             return this.formatError(`Cannot control this setting. Level of control: ${details.levelOfControl}`);
//           }

//           await new Promise<void>((resolve, reject) => {
//             const setDetails: chrome.types.ChromeSettingSetDetails = { value };
//             if (scope) setDetails.scope = scope;

//             chrome.privacy.websites.referrersEnabled.set(setDetails, () => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve();
//               }
//             });
//           });

//           return this.formatSuccess('Referrers setting updated successfully', { value });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerGetRelatedWebsiteSetsEnabled(): void {
//     this.server.registerTool(
//       'get_related_website_sets_enabled',
//       {
//         description: 'Get whether Related Website Sets is enabled',
//         inputSchema: {
//           incognito: z.boolean().optional().describe('Whether to get the setting for incognito mode'),
//         },
//       },
//       async ({ incognito }) => {
//         try {
//           const details = await new Promise<chrome.types.ChromeSettingGetDetails>((resolve, reject) => {
//             chrome.privacy.websites.relatedWebsiteSetsEnabled.get({ incognito: incognito || false }, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details as);
//               }
//             });
//           });

//           return this.formatJson({
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

//   private registerSetRelatedWebsiteSetsEnabled(): void {
//     this.server.registerTool(
//       'set_related_website_sets_enabled',
//       {
//         description: 'Enable or disable Related Website Sets (can only be disabled)',
//         inputSchema: {
//           value: z.boolean().describe('Whether to enable Related Website Sets (only false is allowed)'),
//           scope: z.enum(['regular', 'regular_only', 'incognito_persistent', 'incognito_session_only']).optional().describe('The scope of the setting'),
//         },
//       },
//       async ({ value, scope }) => {
//         try {
//           if (value === true) {
//             return this.formatError('Related Website Sets can only be disabled, not enabled');
//           }

//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.websites.relatedWebsiteSetsEnabled.get({}, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           if (details.levelOfControl !== 'controllable_by_this_extension') {
//             return this.formatError(`Cannot control this setting. Level of control: ${details.levelOfControl}`);
//           }

//           await new Promise<void>((resolve, reject) => {
//             const setDetails: chrome.types.ChromeSettingSetDetails = { value };
//             if (scope) setDetails.scope = scope;

//             chrome.privacy.websites.relatedWebsiteSetsEnabled.set(setDetails, () => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve();
//               }
//             });
//           });

//           return this.formatSuccess('Related Website Sets setting updated successfully', { value });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerGetThirdPartyCookiesAllowed(): void {
//     this.server.registerTool(
//       'get_third_party_cookies_allowed',
//       {
//         description: 'Get whether third-party cookies are allowed',
//         inputSchema: {
//           incognito: z.boolean().optional().describe('Whether to get the setting for incognito mode'),
//         },
//       },
//       async ({ incognito }) => {
//         try {
//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.websites.thirdPartyCookiesAllowed.get({ incognito: incognito || false }, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           return this.formatJson({
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

//   private registerSetThirdPartyCookiesAllowed(): void {
//     this.server.registerTool(
//       'set_third_party_cookies_allowed',
//       {
//         description: 'Enable or disable third-party cookies',
//         inputSchema: {
//           value: z.boolean().describe('Whether to allow third-party cookies'),
//           scope: z.enum(['regular', 'regular_only', 'incognito_persistent', 'incognito_session_only']).optional().describe('The scope of the setting'),
//         },
//       },
//       async ({ value, scope }) => {
//         try {
//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.websites.thirdPartyCookiesAllowed.get({}, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           if (details.levelOfControl !== 'controllable_by_this_extension') {
//             return this.formatError(`Cannot control this setting. Level of control: ${details.levelOfControl}`);
//           }

//           await new Promise<void>((resolve, reject) => {
//             const setDetails: chrome.types.ChromeSettingSetDetails = { value };
//             if (scope) setDetails.scope = scope;

//             chrome.privacy.websites.thirdPartyCookiesAllowed.set(setDetails, () => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve();
//               }
//             });
//           });

//           return this.formatSuccess('Third-party cookies setting updated successfully', { value });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerGetTopicsEnabled(): void {
//     this.server.registerTool(
//       'get_topics_enabled',
//       {
//         description: 'Get whether the Topics API is enabled',
//         inputSchema: {
//           incognito: z.boolean().optional().describe('Whether to get the setting for incognito mode'),
//         },
//       },
//       async ({ incognito }) => {
//         try {
//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.websites.topicsEnabled.get({ incognito: incognito || false }, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           return this.formatJson({
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

//   private registerSetTopicsEnabled(): void {
//     this.server.registerTool(
//       'set_topics_enabled',
//       {
//         description: 'Enable or disable the Topics API (can only be disabled)',
//         inputSchema: {
//           value: z.boolean().describe('Whether to enable the Topics API (only false is allowed)'),
//           scope: z.enum(['regular', 'regular_only', 'incognito_persistent', 'incognito_session_only']).optional().describe('The scope of the setting'),
//         },
//       },
//       async ({ value, scope }) => {
//         try {
//           if (value === true) {
//             return this.formatError('Topics API can only be disabled, not enabled');
//           }

//           const details = await new Promise<chrome.types.ChromeSettingGetResultDetails>((resolve, reject) => {
//             chrome.privacy.websites.topicsEnabled.get({}, (details) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(details);
//               }
//             });
//           });

//           if (details.levelOfControl !== 'controllable_by_this_extension') {
//             return this.formatError(`Cannot control this setting. Level of control: ${details.levelOfControl}`);
//           }

//           await new Promise<void>((resolve, reject) => {
//             const setDetails: chrome.types.ChromeSettingSetDetails = { value };
//             if (scope) setDetails.scope = scope;

//             chrome.privacy.websites.topicsEnabled.set(setDetails, () => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve();
//               }
//             });
//           });

//           return this.formatSuccess('Topics API setting updated successfully', { value });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }
// }
