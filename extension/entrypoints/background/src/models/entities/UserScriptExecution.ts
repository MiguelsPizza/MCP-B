// import { z } from "zod";

// // Zod Schema for UserScriptExecution
// export const userScriptExecutionSchema = z.object({
//     id: z.number(),
//     userScriptId: z.number(),
//     tabId: z.number(),
//     frameId: z.number().nullable(),
//     url: z.string(),
//     domain: z.string(),
//     status: z.enum(['success', 'error', 'blocked', 'skipped']),
//     errorMessage: z.string().nullable(),
//     executionTime: z.number(), // Duration in milliseconds
//     consoleOutput: z.array(z.object({
//         type: z.enum(['log', 'warn', 'error', 'info']),
//         message: z.string(),
//         timestamp: z.number(),
//     })).nullable(),
//     createdAt: z.date(),
// });

// // Schema for adding a new execution log
// export const userScriptExecutionAddSchema = userScriptExecutionSchema.omit({
//     id: true,
//     createdAt: true,
// });
// export type UserScriptExecutionAddData = z.infer<typeof userScriptExecutionAddSchema>;

// // Re-export the main interface type
// export type UserScriptExecution = z.infer<typeof userScriptExecutionSchema>;
