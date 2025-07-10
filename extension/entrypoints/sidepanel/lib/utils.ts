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
