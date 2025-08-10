import { type ClassValue, clsx } from 'clsx';
import type { JSONSchema7 } from 'json-schema';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

/**
 * Hash function to create consistent, shorter identifiers for tool names
 * that exceed the 64 character limit.
 * @param name The tool name to hash
 * @returns A hashed version of the name if it's >= 64 chars, otherwise the original name
 */
export function getToolNameForUI(name: string): string {
  if (name.length < 64) {
    return name;
  }

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `tool_${Math.abs(hash).toString(36)}`;
}
