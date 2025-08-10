// import { z } from "zod";

// // Zod Schema for UserScriptSettings
// export const userScriptSettingsSchema = z.object({
//     id: z.number(),
//     userScriptId: z.number(),
//     autoUpdate: z.boolean(),
//     updateInterval: z.number(), // Hours between update checks
//     requireSecureOrigin: z.boolean(),
//     enabledDomains: z.array(z.string()).nullable(), // Override default matches for specific domains
//     disabledDomains: z.array(z.string()).nullable(), // Domains to always exclude
//     customHeaders: z.record(z.string(), z.string()).nullable(), // Custom headers for requests
//     storageData: z.record(z.string(), z.any()).nullable(), // GM_setValue data
//     grantedPermissions: z.array(z.string()), // Granted GM_* APIs
//     injectionMode: z.enum(['page', 'content', 'isolated']), // Execution context
//     priority: z.number(), // Execution order when multiple scripts match
//     createdAt: z.date(),
//     updatedAt: z.date(),
// });

// // Schema for adding new settings
// export const userScriptSettingsAddSchema = userScriptSettingsSchema.omit({
//     id: true,
//     createdAt: true,
//     updatedAt: true,
// });
// export type UserScriptSettingsAddData = z.infer<typeof userScriptSettingsAddSchema>;

// // Schema for updating settings
// export const userScriptSettingsUpdateSchema = userScriptSettingsSchema.partial().omit({
//     id: true,
//     userScriptId: true,
//     createdAt: true,
// });
// export type UserScriptSettingsUpdateData = z.infer<typeof userScriptSettingsUpdateSchema>;

// // Re-export the main interface type
// export type UserScriptSettings = z.infer<typeof userScriptSettingsSchema>;
