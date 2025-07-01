import { useEffect } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { z, ZodObject, ZodRawShape } from 'zod';
import { useMcpServer } from './context.js';
import { registerFormAsMcpTool, type RegisterFormOptions } from './registerFormAsMcpTool.js';

export interface UseMcpToolFormOptions extends RegisterFormOptions {
  // Additional hook-specific options can go here
}

/**
 * Hook that registers an existing React Hook Form as an MCP tool.
 * This is a convenient wrapper around registerFormAsMcpTool for React components.
 *
 * @param toolName - Unique name for the tool
 * @param form - Your existing React Hook Form instance
 * @param schema - Your existing Zod schema
 * @param options - Optional configuration
 *
 * @example
 * ```tsx
 * // Your existing form setup
 * const schema = z.object({
 *   email: z.string().email(),
 *   message: z.string().min(10)
 * });
 *
 * const form = useForm({
 *   resolver: zodResolver(schema)
 * });
 *
 * // Simply add this hook to make it MCP-enabled
 * useMcpToolForm("contactForm", form, schema, {
 *   title: "Contact Form",
 *   description: "Send a contact message"
 * });
 *
 * // Your existing form JSX remains unchanged
 * ```
 */
export function useMcpToolForm<T extends ZodObject<ZodRawShape>>(
  toolName: string,
  form: UseFormReturn<z.infer<T>>,
  schema: T,
  options?: UseMcpToolFormOptions
): void {
  const mcpServer = useMcpServer();

  useEffect(() => {
    if (!mcpServer) {
      console.warn('No MCP server context found. Tool registration skipped.');
      return;
    }

    // Register the form as an MCP tool
    const unregister = registerFormAsMcpTool(mcpServer, toolName, form, schema, options);

    // Cleanup on unmount
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
