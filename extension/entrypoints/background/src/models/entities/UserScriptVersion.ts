// import { z } from "zod";

// // Zod Schema for UserScriptVersion
// export const userScriptVersionSchema = z.object({
//     id: z.number(),
//     userScriptId: z.number(),
//     version: z.string(),
//     source: z.string(),
//     metadata: z.record(z.string(), z.any()).nullable(),
//     changeLog: z.string().nullable(),
//     isActive: z.boolean(), // Currently active version
//     createdAt: z.date(),
// });

// // Schema for adding a new version
// export const userScriptVersionAddSchema = userScriptVersionSchema.omit({
//     id: true,
//     createdAt: true,
//     isActive: true, // Will be set programmatically
// });
// export type UserScriptVersionAddData = z.infer<typeof userScriptVersionAddSchema>;

// // Re-export the main interface type
// export type UserScriptVersion = z.infer<typeof userScriptVersionSchema>;
