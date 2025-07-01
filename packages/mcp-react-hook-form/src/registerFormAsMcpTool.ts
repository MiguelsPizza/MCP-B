import type { UseFormReturn } from 'react-hook-form';
import type { ZodObject, ZodRawShape } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export interface RegisterFormOptions {
  title?: string;
  description?: string;
  onToolCall?: (data: any) => Promise<any> | any;
}

/**
 * Registers an existing React Hook Form as an MCP tool.
 * This allows AI agents to discover and interact with your form.
 *
 * @param mcpServer - The MCP server instance
 * @param toolName - Unique name for the tool
 * @param form - React Hook Form instance
 * @param schema - Zod schema (must be ZodObject)
 * @param options - Optional configuration
 * @returns Cleanup function to unregister the tool
 *
 * @example
 * ```tsx
 * // Your existing form
 * const form = useForm({
 *   resolver: zodResolver(mySchema)
 * });
 *
 * // Register it as an MCP tool
 * useEffect(() => {
 *   const unregister = registerFormAsMcpTool(
 *     mcpServer,
 *     "myForm",
 *     form,
 *     mySchema,
 *     { title: "My Form" }
 *   );
 *
 *   return unregister;
 * }, []);
 * ```
 */
export function registerFormAsMcpTool<TSchema extends ZodObject<ZodRawShape>>(
  mcpServer: McpServer,
  toolName: string,
  _form: UseFormReturn<any>, // Kept for API compatibility but not used
  schema: TSchema,
  options?: RegisterFormOptions
): () => void {
  // Create the tool handler
  const toolHandler = async (args: any) => {
    try {
      // Validate the input using the form's schema
      const validatedData = await schema.parseAsync(args);

      // If a custom handler is provided, use it
      if (options?.onToolCall) {
        const result = await options.onToolCall(validatedData);
        return {
          content: [
            {
              type: 'text' as const,
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      // Otherwise, just return success
      // The form's actual onSubmit handler remains separate

      return {
        content: [
          {
            type: 'text' as const,
            text: `Successfully processed ${toolName}`,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  };

  // Register the tool
  const tool = mcpServer.tool(toolName, schema.shape, toolHandler);

  // Add metadata if provided
  if (options?.title || options?.description) {
    tool.update({
      title: options?.title,
      description: options?.description,
    });
  }

  // Return cleanup function
  return () => {
    tool.remove();
  };
}
