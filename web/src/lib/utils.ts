import { QueryClient } from '@tanstack/react-query';
import { clsx, type ClassValue } from 'clsx';
// src/lib/mcp/utils.ts
import type { JSONSchema7 } from 'json-schema';
import { twMerge } from 'tailwind-merge';
import { v7 as uuidv7 } from 'uuid';

// --- Utility Functions ---

/**
 * Helper function to merge Tailwind CSS classes.
 * Uses clsx for conditional classes and twMerge for resolving conflicts.
 * @param inputs - An array of class values (strings, objects, arrays).
 * @returns A single string containing the merged class names.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Constants and Instances ---

/**
 * Retrieves or generates a unique user ID.
 * This ID is stored in localStorage for persistence across sessions.
 * It is used here to mock a client identifier.
 */
const initializeUserId = (): string => {
  let id = localStorage.getItem('user-id');
  if (!id) {
    const newId = uuidv7();
    localStorage.setItem('user-id', newId);
    id = newId;
  }
  return id;
};

/**
 * A unique identifier for the current user/client.
 * Stored in localStorage.
 */
export const userId = initializeUserId();

/**
 * QueryClient instance for managing data fetching, caching, and state synchronization
 * using React Query.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered stale after 5 minutes
      staleTime: 1000 * 60 * 5,
      // Do not refetch data automatically when the window regains focus
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Identifier for the transport channel used in the application,
 * likely for communication protocols like MCP.
 */
export const transportChannelId = 'MCP-DEMO';

/**
 * Turn an MCP‐schema object into a plain JSONSchema7 parameters block.
 */
export function mcpToolToJSONSchema(inputSchema: {
  type: 'object';
  properties?: Record<string, unknown>;
  required?: string[];
  [key: string]: unknown;
}): JSONSchema7 {
  return {
    type: inputSchema.type,
    properties: (inputSchema.properties as JSONSchema7['properties']) || {},
    required: inputSchema.required || [],
    ...Object.fromEntries(
      Object.entries(inputSchema).filter(([k]) => !['type', 'properties', 'required'].includes(k))
    ),
  } as JSONSchema7;
}
