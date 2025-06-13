import { z } from 'zod';

/**
 * Todo sort parameters schema
 * Used for filtering and sorting todo items
 */
export const todoSortSchema = z.object({
  sortBy: z
    .enum(['created_at', 'updated_at', 'text', 'completed'])
    .optional()
    .default('created_at')
    .describe('Field to sort todos by'),
  sortOrder: z.enum(['desc', 'asc']).optional().default('desc').describe('Sort direction'),
  completed: z.boolean().optional().describe('Filter by completion status'),
  search: z.string().optional().describe('Search query for todo text'),
});

/**
 * Main page search params
 * Includes tab state, activeView, and todo sorting parameters
 */
export const indexSearchSchema = z.object({
  // Sidebar active view state - 'threads' or 'mcp'
  activeView: z
    .enum(['threads', 'mcp'])
    .optional()
    .default('threads')
    .describe('Active sidebar view'),
  // Current tab - 'assistant' or 'tutorial'
  tab: z
    .enum(['assistant', 'tutorial'])
    .optional()
    .default('assistant')
    .describe('Active tab in the main view'),
  // Todo sorting parameters
  ...todoSortSchema.shape,
});

// Export types for use in components
export type TodoSortParams = z.infer<typeof todoSortSchema>;
export type IndexSearchParams = z.infer<typeof indexSearchSchema>;
