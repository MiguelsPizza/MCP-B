import { tool, useAssistantRuntime } from '@assistant-ui/react';
import { useMcpClient } from '@mcp-b/mcp-react-hooks';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type {
  Tool as McpTool,
  Resource,
  ServerCapabilities,
} from '@modelcontextprotocol/sdk/types.js';
import { useEffect, useMemo } from 'react';
import { mcpToolToJSONSchema } from '../lib/utils';

export function useAssistantMCP(mcpTools: McpTool[], client: Client): void {
  const runtime = useAssistantRuntime();
  const toolNames = useMemo(() => mcpTools.map((t) => t.name).join(', '), [mcpTools]);

  useEffect(() => {
    if (!client || mcpTools.length === 0) {
      return;
    }

    const assistantTools = mcpTools.map((mcpT) => ({
      name: mcpT.name,
      assistantTool: tool({
        type: 'frontend',
        description: mcpT.description,
        parameters: mcpToolToJSONSchema(mcpT.inputSchema),
        execute: (args: Record<string, unknown>) => {
          // We don't need to check for mcpClient here as the effect guard ensures it exists.
          return client.callTool({
            name: mcpT.name,
            arguments: args,
          });
        },
      }),
    }));

    const unregister = runtime.registerModelContextProvider({
      getModelContext: () => ({
        system: 'TOOLS:',
        tools: Object.fromEntries(assistantTools.map((t) => [t.name, t.assistantTool])),
      }),
    });

    return () => {
      unregister();
    };
  }, [client, runtime, toolNames, mcpTools?.length ?? ]);

  return;
}
