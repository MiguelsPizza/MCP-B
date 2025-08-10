// import { z } from "zod";

// // Zod Schema for UserScript
// export const userScriptSchema = z.object({
//     id: z.number(),
//     name: z.string(),
//     description: z.string().nullable(),
//     version: z.string(),
//     author: z.string().nullable(),
//     namespace: z.string().nullable(),
//     enabled: z.boolean(),
//     source: z.string(),
//     metadata: z.record(z.string(), z.any()).nullable(), // For @grant, @require, etc.
//     matches: z.array(z.string()), // URL patterns where script runs
//     excludes: z.array(z.string()).nullable(), // URL patterns to exclude
//     runAt: z.enum(['document-start', 'document-end', 'document-idle']),
//     downloadUrl: z.string().nullable(),
//     updateUrl: z.string().nullable(),
//     homepageUrl: z.string().nullable(),
//     supportUrl: z.string().nullable(),
//     lastModified: z.date(),
//     createdAt: z.date(),
//     updatedAt: z.date(),
// });

// // Schema for adding a new userscript
// export const userScriptAddSchema = userScriptSchema.omit({
//     id: true,
//     createdAt: true,
//     updatedAt: true,
//     lastModified: true,
// });
// export type UserScriptAddData = z.infer<typeof userScriptAddSchema>;

// // Schema for updating a userscript
// export const userScriptUpdateSchema = userScriptSchema.partial().omit({
//     id: true,
//     createdAt: true,
// });
// export type UserScriptUpdateData = z.infer<typeof userScriptUpdateSchema>;

// // Re-export the main interface type
// export type UserScript = z.infer<typeof userScriptSchema>;
