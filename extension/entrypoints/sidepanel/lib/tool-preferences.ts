/**
 * Manages tool preferences for each thread using WXT storage with Zod validation
 */

import { z } from 'zod';

// Zod schemas for validation
export const ThreadToolPreferencesSchema = z.record(z.string(), z.array(z.string()));

export const ThreadToolPreferencesItemSchema = z.object({
  threadId: z.string(),
  toolNames: z.array(z.string()),
});

// Type definitions derived from schemas
export type ThreadToolPreferences = z.infer<typeof ThreadToolPreferencesSchema>;
export type ThreadToolPreferencesItem = z.infer<typeof ThreadToolPreferencesItemSchema>;

// Storage key for WXT storage
export const TOOL_PREFERENCES_STORAGE_KEY = 'local:mcp-thread-tools';

/**
 * Validates and parses tool preferences data
 */
export function validateToolPreferences(data: unknown): ThreadToolPreferences {
  const result = ThreadToolPreferencesSchema.safeParse(data);
  if (!result.success) {
    console.warn('Invalid tool preferences data:', result.error);
    return {};
  }
  return result.data;
}

/**
 * Validates a single thread's tool preferences
 */
export function validateThreadToolPreferences(threadId: string, toolNames: unknown): string[] {
  const result = ThreadToolPreferencesItemSchema.safeParse({
    threadId,
    toolNames,
  });
  if (!result.success) {
    console.warn('Invalid thread tool preferences:', result.error);
    return [];
  }
  return result.data.toolNames;
}

/**
 * Creates a validated tool preferences object
 */
export function createToolPreferences(
  preferences: Record<string, string[]>
): ThreadToolPreferences {
  return validateToolPreferences(preferences);
}

/**
 * Gets the storage key for tool preferences
 */
export function getToolPreferencesStorageKey(): string {
  return TOOL_PREFERENCES_STORAGE_KEY;
}

/**
 * Safely parses tool preferences from storage
 */
export function parseStoredToolPreferences(stored: unknown): ThreadToolPreferences {
  if (stored === null || stored === undefined) {
    return {};
  }

  // If it's already an object, validate it
  if (typeof stored === 'object') {
    return validateToolPreferences(stored);
  }

  // If it's a string, try to parse it as JSON
  if (typeof stored === 'string') {
    try {
      const parsed = JSON.parse(stored);
      return validateToolPreferences(parsed);
    } catch (error) {
      console.warn('Failed to parse stored tool preferences:', error);
      return {};
    }
  }

  console.warn('Unexpected stored tool preferences format:', typeof stored);
  return {};
}
