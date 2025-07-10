import { tool, useAssistantRuntime } from '@assistant-ui/react';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { Tool as McpTool } from '@modelcontextprotocol/sdk/types.js';
import { useEffect, useMemo } from 'react';
import {
  type ThreadToolPreferences,
  TOOL_PREFERENCES_STORAGE_KEY,
  validateToolPreferences,
} from '../lib/tool-preferences';
import { mcpToolToJSONSchema } from '../lib/utils';
import { useStorageItem } from './wxtStorageHooks';

/**
 * Hook that bridges MCP tools with the Assistant UI framework
 *
 * Tool Name Translation:
 * - MCP tools come with tab prefixes (e.g., "tab123_createTodo")
 * - Assistant sees clean names (e.g., "createTodo") for better UX
 * - Execution uses the full prefixed name for proper routing
 *
 * This translation allows the AI to use natural tool names while maintaining
 * the tab-based routing system in the background.
 */
export function useAssistantMCP(mcpTools: McpTool[], client: Client, threadId: string): void {
  const runtime = useAssistantRuntime();
  // Use WXT storage for tool preferences
  const { value: storedPreferences, loading: storageLoading } =
    useStorageItem<ThreadToolPreferences>(TOOL_PREFERENCES_STORAGE_KEY, {
      fallback: {},
    });

  console.log('storedPreferences', storedPreferences);

  // Filter tools based on thread preferences
  const filteredTools = useMemo(() => {
    if (!threadId || storageLoading) return mcpTools;

    const validatedPreferences = validateToolPreferences(storedPreferences || {});
    const preferences = validatedPreferences[threadId];

    if (!preferences || preferences.length === 0) {
      // If no preferences set, use all tools by default
      return mcpTools;
    }

    // Filter tools to only include those in preferences
    return mcpTools.filter((tool) => {
      console.log('tool', tool.name);
      return preferences.includes(tool.name);
    });
  }, [mcpTools, threadId, storedPreferences, storageLoading]);

  const toolNames = useMemo(() => filteredTools.map((t) => t.name).join(', '), [filteredTools]);

  useEffect(() => {
    if (!client || storageLoading) {
      return;
    }

    console.log(
      '[useAssistantMCP] Registering tools for thread',
      threadId,
      ':',
      filteredTools.map((t) => t.name)
    );

    // Always register a context provider, even if there are no tools
    const assistantTools = filteredTools.map((mcpT) => {
      const match = mcpT.name.match(/^tab\d+_(.+)$/);
      const assistantToolName = match ? match[1] : mcpT.name;
      // console.log({ mcpT, assistantToolName });
      return {
        name: mcpT.name,
        assistantTool: tool({
          type: 'frontend',
          description: mcpT.description,
          parameters: mcpToolToJSONSchema(mcpT.inputSchema),
          execute: async (args: Record<string, unknown>) => {
            console.log(`[useAssistantMCP] Executing tool ${assistantToolName} with args:`, args);
            try {
              // Use the clean name - background script now handles both prefixed and unprefixed
              const result = await client.callTool({
                name: mcpT.name,
                arguments: args,
              });
              console.log(`[useAssistantMCP] Tool ${assistantToolName} succeeded`);
              return result;
            } catch (error) {
              console.error(`[useAssistantMCP] Tool ${assistantToolName} failed:`, error);
              throw error;
            }
          },
        }),
      };
    });

    const unregister = runtime.registerModelContextProvider({
      getModelContext: () => ({
        system: filteredTools.length > 0 ? 'TOOLS:' : '',
        tools: Object.fromEntries(assistantTools.map((t) => [t.name, t.assistantTool])),
      }),
    });

    return () => {
      unregister();
    };
  }, [client, storageLoading, toolNames, threadId]);

  return;
}
