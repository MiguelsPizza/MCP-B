// import { storage } from '#imports';
// import { observable } from '@trpc/server/observable';
// import { z } from 'zod';
// import { t } from './router';

// /**
//  * Schema for side panel path configuration
//  */
// const ZSidePanelPath = z.literal('sidepanel.html');
// type SidePanelPath = z.infer<typeof ZSidePanelPath>;

// /**
//  * Schema for tab information
//  */
// const ZTabInfo = z.object({
//   callerTab: z.number().int(),
//   tabId: z.number().int(),
//   url: z.string().optional(),
//   title: z.string().optional(),
//   favIconUrl: z.string().optional(),
//   isActive: z.boolean(),
//   windowId: z.number().int()
// });
// export type TabInfo = z.infer<typeof ZTabInfo>;

// /**
//  * Schema for side panel configuration
//  */
// const ZSidePanelConfig = z.object({
//   path: z.string(),
//   enabled: z.boolean(),
//   tabId: z.number().int().optional()
// });

// export type SidePanelConfig = z.infer<typeof ZSidePanelConfig>;

// /**
//  * extensionRouter:
//  * A tRPC router that provides procedures for Chrome extension functionality,
//  * particularly focused on side panel management, tab interactions, and browser state.
//  * Includes real-time subscriptions for tab and browser changes, as well as mutations
//  * for controlling the extension's UI components.
//  */
// export const extensionRouter = t.router({
//   /**
//    * Get information about the currently active tab.
//    *
//    * @returns {Promise<TabInfo>} Object containing tab details like ID, URL, and title.
//    */
//   getTabInfo: t.procedure
//     .query(async ({ ctx }): Promise<TabInfo> => {
//       console.log("getTabInfo", chrome.tabs);
//       const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
//       const currentTab = tabs[0];

//       if (!currentTab) {
//         throw new Error("No active tab found");
//       }

//       return {
//         callerTab: ctx.tabId ?? -1,
//         tabId: currentTab.id ?? -1,
//         url: currentTab.url ?? "",
//         title: currentTab.title ?? "",
//         favIconUrl: currentTab.favIconUrl ?? "",
//         isActive: currentTab.active ?? true,
//         windowId: currentTab.windowId ?? -1
//       };
//     }),

//   /**
//    * Toggle the side panel for the current tab.
//    *
//    * This procedure toggles the side panel specifically for the currently active tab.
//    * If the panel is currently closed, it will open it.
//    * If the panel is currently open, it will close it.
//    *
//    * @input {Object} options - Panel toggle options
//    * @input {string} options.path - Optional path to use when opening the panel
//    * @returns {Promise<{success: boolean, tabId: number | null}>} Object indicating success status and the tab ID.
//    */
//   toggleSidePanel: t.procedure
//     .input(z.object({
//       tabId: z.number(),
//       windowId: z.number(),
//     }))
//     .mutation(({ input, ctx }) => {
//       console.log("toggleSidePanel", ctx.tabId)
//       chrome.sidePanel.open({ tabId: input.tabId, windowId: input.windowId });
//     }),

//   /**
//    * Subscribe to changes in the active tab.
//    *
//    * This subscription emits new tab information whenever the active tab changes,
//    * allowing clients to react to tab navigation events in real-time.
//    *
//    * @returns {Observable<TabInfo>} An observable stream of tab information.
//    */
//   liveActiveTab: t.procedure.subscription(() => {
//     return observable<TabInfo>((emit) => {
//       // Function to emit current tab info
//       const emitCurrentTabInfo = async () => {
//         try {
//           const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
//           const currentTab = tabs[0];

//           if (currentTab && currentTab.id) {
//             emit.next({
//               callerTab: -1,
//               tabId: currentTab.id,
//               url: currentTab.url ?? "",
//               title: currentTab.title ?? "",
//               favIconUrl: currentTab.favIconUrl ?? "",
//               isActive: currentTab.active ?? true,
//               windowId: currentTab.windowId ?? -1
//             });
//           }
//         } catch (error) {
//           console.error("Error getting active tab info:", error);
//         }
//       };

//       // Emit initial tab info
//       emitCurrentTabInfo();

//       // Listen for tab activation changes
//       const onActivated = (activeInfo: chrome.tabs.TabActiveInfo) => {
//         chrome.tabs.get(activeInfo.tabId, (tab) => {
//           if (chrome.runtime.lastError) {
//             console.error(chrome.runtime.lastError);
//             return;
//           }

//           if (tab && tab.id) {
//             emit.next({
//               callerTab: -1,
//               tabId: tab.id,
//               url: tab.url ?? "",
//               title: tab.title ?? "",
//               favIconUrl: tab.favIconUrl ?? "",
//               isActive: tab.active ?? true,
//               windowId: tab.windowId ?? -1
//             });
//           }
//         });
//       };

//       // Listen for tab updates (URL changes, etc.)
//       const onUpdated = (_tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
//         if (tab.active && changeInfo.status === 'complete' && tab.id) {
//           emit.next({
//             callerTab: -1,
//             tabId: tab.id,
//             url: tab.url ?? "",
//             title: tab.title ?? "",
//             favIconUrl: tab.favIconUrl ?? "",
//             isActive: tab.active ?? true,
//             windowId: tab.windowId ?? -1
//           });
//         }
//       };

//       // Add event listeners
//       chrome.tabs.onActivated.addListener(onActivated);
//       chrome.tabs.onUpdated.addListener(onUpdated);

//       // Return cleanup function
//       return () => {
//         chrome.tabs.onActivated.removeListener(onActivated);
//         chrome.tabs.onUpdated.removeListener(onUpdated);
//       };
//     });
//   }),

//   /**
//    * Configure side panel behavior for specific URLs.
//    *
//    * This procedure sets up rules for when the side panel should be automatically
//    * enabled or disabled based on the URL pattern.
//    *
//    * @input {Object} options - Configuration options
//    * @input {string[]} options.enabledPatterns - URL patterns where the panel should be enabled
//    * @input {SidePanelPath} options.defaultPath - The default panel to show when enabled
//    * @returns {Promise<{success: boolean}>} Object indicating success status
//    */
//   configureSidePanelBehavior: t.procedure
//     .input(z.object({
//       enabledPatterns: z.array(z.string()),
//       defaultPath: z.string().optional()
//     }))
//     .mutation(async ({ input }): Promise<{ success: boolean }> => {
//       try {
//         // Store the configuration in extension storage
//         await storage.setItem('sync:sidePanelEnabledPatterns', input.enabledPatterns);

//         if (input.defaultPath) {
//           await storage.setItem('sync:defaultSidePanelPath', input.defaultPath);
//         }

//         // Set the panel behavior to open on action click
//         await chrome.sidePanel.setPanelBehavior({
//           openPanelOnActionClick: true
//         });

//         return { success: true };
//       } catch (error) {
//         console.error("Error configuring side panel behavior:", error);
//         return { success: false };
//       }
//     }),

//   /**
//    * Get the current side panel configuration.
//    *
//    * Retrieves the current configuration for the side panel, including
//    * whether it's enabled for the active tab and which panel is shown.
//    *
//    * @returns {Promise<{isEnabled: boolean, currentPath: SidePanelPath | null}>} The current configuration
//    */
//   getSidePanelConfig: t.procedure
//     .query(async (): Promise<{ isEnabled: boolean, currentPath: SidePanelPath | null }> => {
//       try {
//         const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
//         const currentTab = tabs[0];

//         if (!currentTab || !currentTab.id) {
//           return { isEnabled: false, currentPath: null };
//         }

//         // Get the options for the current tab
//         const options = await chrome.sidePanel.getOptions({ tabId: currentTab.id });

//         return {
//           isEnabled: options.enabled ?? false,
//           currentPath: options.path as SidePanelPath || null
//         };
//       } catch (error) {
//         console.error("Error getting side panel config:", error);
//         return { isEnabled: false, currentPath: null };
//       }
//     }),

//   /**
//    * Change the panel displayed in the side panel.
//    *
//    * Switches the content shown in the side panel without closing it,
//    * allowing for seamless navigation between different panels.
//    *
//    * @input {SidePanelPath} path - The path to the new panel to display
//    * @returns {Promise<{success: boolean}>} Object indicating success status
//    */
//   changeSidePanel: t.procedure
//     .input(ZSidePanelPath)
//     .mutation(async ({ input: path }): Promise<{ success: boolean }> => {
//       try {
//         const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
//         const currentTab = tabs[0];

//         if (!currentTab || !currentTab.id) {
//           console.error("Cannot change side panel: No active tab found");
//           return { success: false };
//         }

//         // Get current options to preserve enabled state
//         const currentOptions = await chrome.sidePanel.getOptions({ tabId: currentTab.id });

//         // Update the panel path while keeping the enabled state
//         await chrome.sidePanel.setOptions({
//           tabId: currentTab.id,
//           path: path,
//           enabled: currentOptions.enabled ?? true
//         });

//         // Store the last used panel path
//         await storage.setItem('sync:lastSidePanelPath', path);

//         return { success: true };
//       } catch (error) {
//         console.error("Error changing side panel:", error);
//         return { success: false };
//       }
//     }),

//   /**
//    * Get a list of all open tabs.
//    *
//    * Retrieves information about all open tabs across all windows.
//    *
//    * @returns {Promise<TabInfo[]>} Array of tab information objects
//    */
//   getAllTabs: t.procedure
//     .query(async (): Promise<TabInfo[]> => {
//       const tabs = await chrome.tabs.query({});

//       return tabs.map(tab => ({
//         callerTab: -1,
//         tabId: tab.id ?? -1,
//         url: tab.url ?? "",
//         title: tab.title ?? "",
//         favIconUrl: tab.favIconUrl ?? "",
//         isActive: tab.active ?? false,
//         windowId: tab.windowId ?? -1
//       }));
//     }),

//   /**
//    * Navigate to a specific tab.
//    *
//    * Activates the specified tab and brings its window to the front.
//    *
//    * @input {number} tabId - The ID of the tab to navigate to
//    * @returns {Promise<{success: boolean}>} Object indicating success status
//    */
//   navigateToTab: t.procedure
//     .input(z.number().int())
//     .mutation(async ({ input: tabId }): Promise<{ success: boolean }> => {
//       try {
//         await chrome.tabs.update(tabId, { active: true });

//         // Get the window ID for this tab
//         const tab = await chrome.tabs.get(tabId);

//         // Focus the window containing this tab
//         if (tab.windowId) {
//           await chrome.windows.update(tab.windowId, { focused: true });
//         }

//         return { success: true };
//       } catch (error) {
//         console.error(`Error navigating to tab ${tabId}:`, error);
//         return { success: false };
//       }
//     }),

//   /**
//    * Create a new tab with the specified URL.
//    *
//    * Opens a new tab with the given URL and optionally makes it active.
//    *
//    * @input {Object} options - Tab creation options
//    * @input {string} options.url - The URL to navigate to
//    * @input {boolean} options.active - Whether to make the new tab active
//    * @returns {Promise<{success: boolean, tabId: number | null}>} Object with success status and new tab ID
//    */
//   createNewTab: t.procedure
//     .input(z.object({
//       url: z.string(),
//       active: z.boolean()
//     }))
//     .mutation(async ({ input }): Promise<{ success: boolean, tabId: number | null }> => {
//       try {
//         const newTab = await chrome.tabs.create({
//           url: input.url,
//           active: input.active
//         });

//         return {
//           success: true,
//           tabId: newTab.id ?? null
//         };
//       } catch (error) {
//         console.error("Error creating new tab:", error);
//         return { success: false, tabId: null };
//       }
//     }),

//   /**
//    * Get the extension's current state, including side panel configuration
//    * and other extension-specific settings.
//    *
//    * @returns {Promise<Object>} The current extension state
//    */
//   getExtensionState: t.procedure
//     .query(async () => {
//       // Get side panel configuration
//       const enabledPatterns = await storage.getItem<string[]>('sync:sidePanelEnabledPatterns') || [];
//       const defaultPath = await storage.getItem<SidePanelPath>('sync:defaultSidePanelPath') || 'sidepanel.html';
//       const lastPath = await storage.getItem<SidePanelPath>('sync:lastSidePanelPath') || defaultPath;

//       // Get panel behavior
//       const behavior = await chrome.sidePanel.getPanelBehavior();

//       return {
//         sidePanel: {
//           enabledPatterns,
//           defaultPath,
//           lastPath,
//           openOnActionClick: behavior.openPanelOnActionClick
//         },
//         extensionInfo: {
//           id: chrome.runtime.id,
//           version: chrome.runtime.getManifest().version
//         }
//       };
//     }),

//   /**
//    * Execute a script in the current tab.
//    *
//    * Injects and executes the provided JavaScript in the current tab.
//    * Useful for direct DOM manipulation or data extraction.
//    *
//    * @input {string} script - The JavaScript code to execute
//    * @returns {Promise<any>} The result of the script execution
//    */
//   executeScript: t.procedure
//     .input(z.string())
//     .mutation(async ({ input: script }): Promise<any> => {
//       try {
//         const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
//         const currentTab = tabs[0];

//         if (!currentTab || !currentTab.id) {
//           throw new Error("No active tab found");
//         }

//         const results = await chrome.scripting.executeScript({
//           target: { tabId: currentTab.id },
//           func: new Function(script) as () => void
//         });

//         return results[0]?.result;
//       } catch (error) {
//         console.error("Error executing script:", error);
//         throw error;
//       }
//     }),

//   /**
//    * Enable the floating UI for the current tab.
//    *
//    * This procedure sends a message to the content script to enable the floating UI.
//    *
//    * @returns {Promise<{success: boolean}>} Object indicating success status
//    */
//   enableFloatingUI: t.procedure
//     .mutation(async (): Promise<{ success: boolean }> => {
//       try {
//         await chrome.runtime.sendMessage({ type: 'enable-floating-ui' });
//         return { success: true };
//       } catch (error) {
//         console.error("Error enabling floating UI:", error);
//         return { success: false };
//       }
//     })
// });

// export type ExtensionRouterType = typeof extensionRouter
