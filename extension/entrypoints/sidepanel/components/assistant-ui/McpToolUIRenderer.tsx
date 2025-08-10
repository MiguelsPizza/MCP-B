import { useAssistantToolUI } from '@assistant-ui/react';
import { useMcpClient } from '@mcp-b/mcp-react-hooks';
import type { Tool as McpTool } from '@modelcontextprotocol/sdk/types.js';
import { useEffect } from 'react';
import { getToolNameForUI } from '../../lib/utils';
import { ToolErrorUI, ToolRunningUI, ToolSuccessUI } from './ToolUIs';

const FancyToolRenderer = ({ tool }: { tool: McpTool }) => {
  // Extract the clean tool name without tab prefix for UI registration
  const match = tool.name.match(/^tab\d+_(.+)$/);
  const cleanToolName = match ? match[1] : tool.name;

  // Use hash if the name is too long (64 char limit), matching useAssistantMCP logic
  const toolName = getToolNameForUI(tool.name);

  useAssistantToolUI({
    toolName: toolName,
    render: ({ args, status, result, addResult, toolCallId }) => {
      if (status.type === 'running' || status.type === 'requires-action') {
        return <ToolRunningUI tool={tool} args={args} />;
      }

      // if (status.type === 'requires-action') { // TODO: figure out how to handle this
      //   const handleSubmit = (formData: Record<string, any>) => {
      //     if (!addResult || !toolCallId) return;
      //     addResult({ toolCallId, result: formData });
      //   };
      //   return (
      //     <ToolInteractiveForm
      //       tool={tool}
      //       args={args}
      //       onSubmit={handleSubmit}
      //     />
      //   );
      // }

      if (status.type === 'incomplete' && status.reason === 'error') {
        return <ToolErrorUI tool={tool} status={status} />;
      }

      if (status.type === 'complete') {
        // Check for the isError flag first (proper MCP protocol)
        if (result?.isError) {
          const errorText = result?.content?.[0]?.text || 'Tool execution failed';
          const errorStatus = {
            type: 'incomplete',
            reason: 'error',
            error: new Error(errorText),
          };
          return <ToolErrorUI tool={tool} status={errorStatus} />;
        }

        // Fallback: Check if the result content contains error messages (for legacy compatibility)
        const resultText = result?.content?.[0]?.text || '';
        const hasErrorText =
          resultText.includes('McpError:') ||
          resultText.includes('MCP error') ||
          resultText.includes('Error:') ||
          resultText.includes('Failed to');

        if (hasErrorText) {
          // Create a synthetic error status for the error UI
          const errorStatus = {
            type: 'incomplete',
            reason: 'error',
            error: new Error(resultText),
          };
          return <ToolErrorUI tool={tool} status={errorStatus} />;
        }

        return <ToolSuccessUI tool={tool} result={result} />;
      }

      return null;
    },
  });

  return null;
};

export const McpToolUIRenderer = ({ tools }: { tools: McpTool[] }) => {
  return (
    <>
      {tools.map((tool) => (
        <FancyToolRenderer key={tool.name} tool={tool} />
      ))}
    </>
  );
};
