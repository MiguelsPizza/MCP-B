import { useEffect } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { z, ZodObject, ZodRawShape } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerFormAsMcpTool, type RegisterFormOptions } from './registerFormAsMcpTool.js';

/**
 * Hook that registers an existing React Hook Form as an MCP tool.
 * This version takes the MCP server directly as a parameter.
 *
 * @param mcpServer - The MCP server instance
 * @param toolName - Unique name for the tool
 * @param form - Your existing React Hook Form instance
 * @param schema - Your existing Zod schema
 * @param options - Optional configuration
 *
 * @example
 * ```tsx
 * // Your existing form
 * const form = useForm({
 *   resolver: zodResolver(contactSchema)
 * });
 *
 * // Make it MCP-enabled
 * useMcpToolFormDirect(mcpServer, "contactForm", form, contactSchema);
 * ```
 */
export function useMcpToolFormDirect<T extends ZodObject<ZodRawShape>>(
  mcpServer: McpServer,
  toolName: string,
  form: UseFormReturn<z.infer<T>>,
  schema: T,
  options?: RegisterFormOptions
): void {
  useEffect(() => {
    const unregister = registerFormAsMcpTool(mcpServer, toolName, form, schema, options);

    return unregister;
  }, [
    mcpServer,
    toolName,
    form,
    schema,
    options?.title,
    options?.description,
    options?.onToolCall,
  ]);
}
