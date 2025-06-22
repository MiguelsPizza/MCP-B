// import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// import { z } from 'zod';
// import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

// export interface EventsApiToolsOptions {
//   addEventListener?: boolean;
//   removeEventListener?: boolean;
//   hasEventListener?: boolean;
//   hasEventListeners?: boolean;
//   addRules?: boolean;
//   removeRules?: boolean;
//   getRules?: boolean;
//   createUrlFilter?: boolean;
// }

// export class EventsApiTools extends BaseApiTools {
//   protected apiName = 'Events';

//   constructor(server: McpServer, options: EventsApiToolsOptions = {}) {
//     super(server, options);
//   }

//   checkAvailability(): ApiAvailability {
//     try {
//       // Check if API exists
//       if (!chrome) {
//         return {
//           available: false,
//           message: 'chrome.events API is not defined',
//           details:
//             'This extension needs appropriate permissions in its manifest.json to use event APIs',
//         };
//       }

//       // Test basic functionality by checking if Event constructor exists
//       if (typeof chrome.events.Event !== 'function') {
//         return {
//           available: false,
//           message: 'chrome.events.Event is not available',
//           details: 'The events API appears to be partially available. Check manifest permissions.',
//         };
//       }

//       return {
//         available: true,
//         message: 'Events API is fully available',
//       };
//     } catch (error) {
//       return {
//         available: false,
//         message: 'Failed to access chrome.events API',
//         details: error instanceof Error ? error.message : 'Unknown error occurred',
//       };
//     }
//   }

//   registerTools(): void {
//     if (this.shouldRegisterTool('addEventListener')) {
//       this.registerAddEventListener();
//     }

//     if (this.shouldRegisterTool('removeEventListener')) {
//       this.registerRemoveEventListener();
//     }

//     if (this.shouldRegisterTool('hasEventListener')) {
//       this.registerHasEventListener();
//     }

//     if (this.shouldRegisterTool('hasEventListeners')) {
//       this.registerHasEventListeners();
//     }

//     if (this.shouldRegisterTool('addRules')) {
//       this.registerAddRules();
//     }

//     if (this.shouldRegisterTool('removeRules')) {
//       this.registerRemoveRules();
//     }

//     if (this.shouldRegisterTool('getRules')) {
//       this.registerGetRules();
//     }

//     if (this.shouldRegisterTool('createUrlFilter')) {
//       this.registerCreateUrlFilter();
//     }
//   }

//   private registerAddEventListener(): void {
//     this.server.registerTool(
//       'add_event_listener',
//       {
//         description:
//           'Add an event listener to a Chrome event. Note: This creates a reference but actual callback execution depends on the extension context',
//         inputSchema: {
//           eventName: z
//             .string()
//             .describe(
//               'Name of the Chrome event (e.g., "chrome.alarms.onAlarm", "chrome.tabs.onCreated")'
//             ),
//           filters: z
//             .record(z.any())
//             .optional()
//             .describe('Optional filters to apply to the event listener'),
//           listenerInfo: z
//             .object({
//               description: z.string().describe('Description of what this listener does'),
//               parameters: z
//                 .array(z.string())
//                 .optional()
//                 .describe('Expected parameter names for the callback'),
//             })
//             .describe('Information about the listener being added'),
//         },
//       },
//       async ({ eventName, filters, listenerInfo }) => {
//         try {
//           // Parse the event name to get the API and event
//           const eventParts = eventName.split('.');
//           if (eventParts.length < 3 || eventParts[0] !== 'chrome') {
//             return this.formatError('Event name must be in format "chrome.api.eventName"');
//           }

//           const apiName = eventParts[1];
//           const eventNamePart = eventParts[2];

//           // Check if the API exists
//           const api = (chrome as any)[apiName];
//           if (!api) {
//             return this.formatError(`Chrome API "${apiName}" is not available`);
//           }

//           // Check if the event exists
//           const event = api[eventNamePart];
//           if (!event || typeof event.addListener !== 'function') {
//             return this.formatError(
//               `Event "${eventName}" is not available or does not support listeners`
//             );
//           }

//           // Create a dummy listener function for demonstration
//           const dummyListener = (...args: any[]) => {
//             console.log(`Event ${eventName} fired with args:`, args);
//           };

//           // Add the listener
//           if (filters) {
//             event.addListener(dummyListener, filters);
//           } else {
//             event.addListener(dummyListener);
//           }

//           return this.formatSuccess('Event listener added successfully', {
//             eventName,
//             filters: filters || null,
//             listenerInfo,
//             note: 'This is a demonstration. In a real extension, you would provide your own callback function.',
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerRemoveEventListener(): void {
//     this.server.registerTool(
//       'remove_event_listener',
//       {
//         description: 'Remove an event listener from a Chrome event',
//         inputSchema: {
//           eventName: z
//             .string()
//             .describe(
//               'Name of the Chrome event (e.g., "chrome.alarms.onAlarm", "chrome.tabs.onCreated")'
//             ),
//           listenerDescription: z
//             .string()
//             .optional()
//             .describe('Description of the listener to remove (for reference only)'),
//         },
//       },
//       async ({ eventName, listenerDescription }) => {
//         try {
//           // Parse the event name to get the API and event
//           const eventParts = eventName.split('.');
//           if (eventParts.length < 3 || eventParts[0] !== 'chrome') {
//             return this.formatError('Event name must be in format "chrome.api.eventName"');
//           }

//           const apiName = eventParts[1];
//           const eventNamePart = eventParts[2];

//           // Check if the API exists
//           const api = (chrome as any)[apiName];
//           if (!api) {
//             return this.formatError(`Chrome API "${apiName}" is not available`);
//           }

//           // Check if the event exists
//           const event = api[eventNamePart];
//           if (!event || typeof event.removeListener !== 'function') {
//             return this.formatError(
//               `Event "${eventName}" is not available or does not support listener removal`
//             );
//           }

//           return this.formatSuccess('Event listener removal requested', {
//             eventName,
//             listenerDescription: listenerDescription || 'No description provided',
//             note: 'To actually remove a listener, you need a reference to the original callback function used with addListener.',
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerHasEventListener(): void {
//     this.server.registerTool(
//       'has_event_listener',
//       {
//         description: 'Check if a specific event listener is registered for a Chrome event',
//         inputSchema: {
//           eventName: z
//             .string()
//             .describe(
//               'Name of the Chrome event (e.g., "chrome.alarms.onAlarm", "chrome.tabs.onCreated")'
//             ),
//           listenerDescription: z
//             .string()
//             .optional()
//             .describe('Description of the listener to check (for reference only)'),
//         },
//       },
//       async ({ eventName, listenerDescription }) => {
//         try {
//           // Parse the event name to get the API and event
//           const eventParts = eventName.split('.');
//           if (eventParts.length < 3 || eventParts[0] !== 'chrome') {
//             return this.formatError('Event name must be in format "chrome.api.eventName"');
//           }

//           const apiName = eventParts[1];
//           const eventNamePart = eventParts[2];

//           // Check if the API exists
//           const api = (chrome as any)[apiName];
//           if (!api) {
//             return this.formatError(`Chrome API "${apiName}" is not available`);
//           }

//           // Check if the event exists
//           const event = api[eventNamePart];
//           if (!event || typeof event.hasListener !== 'function') {
//             return this.formatError(
//               `Event "${eventName}" is not available or does not support hasListener`
//             );
//           }

//           return this.formatSuccess('Event listener check completed', {
//             eventName,
//             listenerDescription: listenerDescription || 'No description provided',
//             note: 'To check for a specific listener, you need a reference to the original callback function.',
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerHasEventListeners(): void {
//     this.server.registerTool(
//       'has_event_listeners',
//       {
//         description: 'Check if any event listeners are registered for a Chrome event',
//         inputSchema: {
//           eventName: z
//             .string()
//             .describe(
//               'Name of the Chrome event (e.g., "chrome.alarms.onAlarm", "chrome.tabs.onCreated")'
//             ),
//         },
//       },
//       async ({ eventName }) => {
//         try {
//           // Parse the event name to get the API and event
//           const eventParts = eventName.split('.');
//           if (eventParts.length < 3 || eventParts[0] !== 'chrome') {
//             return this.formatError('Event name must be in format "chrome.api.eventName"');
//           }

//           const apiName = eventParts[1];
//           const eventNamePart = eventParts[2];

//           // Check if the API exists
//           const api = (chrome as any)[apiName];
//           if (!api) {
//             return this.formatError(`Chrome API "${apiName}" is not available`);
//           }

//           // Check if the event exists
//           const event = api[eventNamePart];
//           if (!event || typeof event.hasListeners !== 'function') {
//             return this.formatError(
//               `Event "${eventName}" is not available or does not support hasListeners`
//             );
//           }

//           const hasListeners = event.hasListeners();

//           return this.formatJson({
//             eventName,
//             hasListeners,
//             message: hasListeners
//               ? 'Event has registered listeners'
//               : 'Event has no registered listeners',
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerAddRules(): void {
//     this.server.registerTool(
//       'add_rules',
//       {
//         description: 'Add declarative rules to an event that supports them',
//         inputSchema: {
//           eventName: z
//             .string()
//             .describe(
//               'Name of the Chrome event that supports rules (e.g., "chrome.declarativeContent.onPageChanged")'
//             ),
//           rules: z
//             .array(
//               z.object({
//                 id: z.string().optional().describe('Optional identifier for the rule'),
//                 priority: z.number().optional().describe('Optional priority (defaults to 100)'),
//                 conditions: z.array(z.record(z.any())).describe('Array of condition objects'),
//                 actions: z.array(z.record(z.any())).describe('Array of action objects'),
//                 tags: z.array(z.string()).optional().describe('Optional tags for the rule'),
//               })
//             )
//             .describe('Array of rules to add'),
//         },
//       },
//       async ({ eventName, rules }) => {
//         try {
//           // Parse the event name to get the API and event
//           const eventParts = eventName.split('.');
//           if (eventParts.length < 3 || eventParts[0] !== 'chrome') {
//             return this.formatError('Event name must be in format "chrome.api.eventName"');
//           }

//           const apiName = eventParts[1];
//           const eventNamePart = eventParts[2];

//           // Check if the API exists
//           const api = (chrome as any)[apiName];
//           if (!api) {
//             return this.formatError(`Chrome API "${apiName}" is not available`);
//           }

//           // Check if the event exists
//           const event = api[eventNamePart];
//           if (!event || typeof event.addRules !== 'function') {
//             return this.formatError(
//               `Event "${eventName}" is not available or does not support rules`
//             );
//           }

//           const addedRules = await new Promise<any[]>((resolve, reject) => {
//             event.addRules(rules, (addedRules: any[]) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(addedRules);
//               }
//             });
//           });

//           return this.formatSuccess('Rules added successfully', {
//             eventName,
//             rulesCount: addedRules.length,
//             addedRules: addedRules.map((rule: any) => ({
//               id: rule.id,
//               priority: rule.priority,
//               conditionsCount: rule.conditions?.length || 0,
//               actionsCount: rule.actions?.length || 0,
//             })),
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerRemoveRules(): void {
//     this.server.registerTool(
//       'remove_rules',
//       {
//         description: 'Remove declarative rules from an event',
//         inputSchema: {
//           eventName: z.string().describe('Name of the Chrome event that supports rules'),
//           ruleIds: z
//             .array(z.string())
//             .optional()
//             .describe('Array of rule IDs to remove. If not specified, all rules are removed'),
//         },
//       },
//       async ({ eventName, ruleIds }) => {
//         try {
//           // Parse the event name to get the API and event
//           const eventParts = eventName.split('.');
//           if (eventParts.length < 3 || eventParts[0] !== 'chrome') {
//             return this.formatError('Event name must be in format "chrome.api.eventName"');
//           }

//           const apiName = eventParts[1];
//           const eventNamePart = eventParts[2];

//           // Check if the API exists
//           const api = (chrome as any)[apiName];
//           if (!api) {
//             return this.formatError(`Chrome API "${apiName}" is not available`);
//           }

//           // Check if the event exists
//           const event = api[eventNamePart];
//           if (!event || typeof event.removeRules !== 'function') {
//             return this.formatError(
//               `Event "${eventName}" is not available or does not support rule removal`
//             );
//           }

//           await new Promise<void>((resolve, reject) => {
//             event.removeRules(ruleIds, () => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve();
//               }
//             });
//           });

//           return this.formatSuccess('Rules removed successfully', {
//             eventName,
//             removedRuleIds: ruleIds || 'all rules',
//             removedCount: ruleIds ? ruleIds.length : 'all',
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerGetRules(): void {
//     this.server.registerTool(
//       'get_rules',
//       {
//         description: 'Get declarative rules from an event',
//         inputSchema: {
//           eventName: z.string().describe('Name of the Chrome event that supports rules'),
//           ruleIds: z
//             .array(z.string())
//             .optional()
//             .describe('Array of rule IDs to retrieve. If not specified, all rules are returned'),
//         },
//       },
//       async ({ eventName, ruleIds }) => {
//         try {
//           // Parse the event name to get the API and event
//           const eventParts = eventName.split('.');
//           if (eventParts.length < 3 || eventParts[0] !== 'chrome') {
//             return this.formatError('Event name must be in format "chrome.api.eventName"');
//           }

//           const apiName = eventParts[1];
//           const eventNamePart = eventParts[2];

//           // Check if the API exists
//           const api = (chrome as any)[apiName];
//           if (!api) {
//             return this.formatError(`Chrome API "${apiName}" is not available`);
//           }

//           // Check if the event exists
//           const event = api[eventNamePart];
//           if (!event || typeof event.getRules !== 'function') {
//             return this.formatError(
//               `Event "${eventName}" is not available or does not support getting rules`
//             );
//           }

//           const rules = await new Promise<any[]>((resolve, reject) => {
//             event.getRules(ruleIds, (rules: any[]) => {
//               if (chrome.runtime.lastError) {
//                 reject(new Error(chrome.runtime.lastError.message));
//               } else {
//                 resolve(rules);
//               }
//             });
//           });

//           return this.formatJson({
//             eventName,
//             rulesCount: rules.length,
//             requestedRuleIds: ruleIds || 'all rules',
//             rules: rules.map((rule: any) => ({
//               id: rule.id,
//               priority: rule.priority,
//               conditions: rule.conditions,
//               actions: rule.actions,
//               tags: rule.tags,
//             })),
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }

//   private registerCreateUrlFilter(): void {
//     this.server.registerTool(
//       'create_url_filter',
//       {
//         description: 'Create a URL filter object for use with filtered events',
//         inputSchema: {
//           hostContains: z
//             .string()
//             .optional()
//             .describe('Matches if the host name contains this string'),
//           hostEquals: z.string().optional().describe('Matches if the host name equals this string'),
//           hostPrefix: z
//             .string()
//             .optional()
//             .describe('Matches if the host name starts with this string'),
//           hostSuffix: z
//             .string()
//             .optional()
//             .describe('Matches if the host name ends with this string'),
//           pathContains: z.string().optional().describe('Matches if the path contains this string'),
//           pathEquals: z.string().optional().describe('Matches if the path equals this string'),
//           pathPrefix: z.string().optional().describe('Matches if the path starts with this string'),
//           pathSuffix: z.string().optional().describe('Matches if the path ends with this string'),
//           queryContains: z
//             .string()
//             .optional()
//             .describe('Matches if the query contains this string'),
//           queryEquals: z.string().optional().describe('Matches if the query equals this string'),
//           queryPrefix: z
//             .string()
//             .optional()
//             .describe('Matches if the query starts with this string'),
//           querySuffix: z.string().optional().describe('Matches if the query ends with this string'),
//           urlContains: z.string().optional().describe('Matches if the URL contains this string'),
//           urlEquals: z.string().optional().describe('Matches if the URL equals this string'),
//           urlMatches: z
//             .string()
//             .optional()
//             .describe('Matches if the URL matches this regular expression'),
//           urlPrefix: z.string().optional().describe('Matches if the URL starts with this string'),
//           urlSuffix: z.string().optional().describe('Matches if the URL ends with this string'),
//           schemes: z
//             .array(z.string())
//             .optional()
//             .describe('Matches if the scheme is in this array'),
//           ports: z
//             .array(z.union([z.number(), z.array(z.number())]))
//             .optional()
//             .describe('Matches if the port is in this array or ranges'),
//           originAndPathMatches: z
//             .string()
//             .optional()
//             .describe('Matches if the origin and path match this regex'),
//           cidrBlocks: z
//             .array(z.string())
//             .optional()
//             .describe('Matches if the host IP is in these CIDR blocks'),
//         },
//       },
//       async (params) => {
//         try {
//           const urlFilter: any = {};

//           // Add all provided parameters to the filter
//           Object.entries(params).forEach(([key, value]) => {
//             if (value !== undefined) {
//               urlFilter[key] = value;
//             }
//           });

//           if (Object.keys(urlFilter).length === 0) {
//             return this.formatError('At least one filter parameter must be provided');
//           }

//           return this.formatJson({
//             urlFilter,
//             filterCount: Object.keys(urlFilter).length,
//             usage:
//               'This URL filter can be used with filtered events like chrome.webNavigation.onCommitted.addListener(callback, {url: [urlFilter]})',
//             appliedFilters: Object.keys(urlFilter),
//           });
//         } catch (error) {
//           return this.formatError(error);
//         }
//       }
//     );
//   }
// }
