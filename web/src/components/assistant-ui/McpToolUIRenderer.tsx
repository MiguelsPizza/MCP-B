import { useAssistantToolUI } from '@assistant-ui/react';
import type { Tool as McpTool } from '@modelcontextprotocol/sdk/types.js';
import { ToolErrorUI, ToolRunningUI, ToolSuccessUI } from './ToolUIs';

const FancyToolRenderer = ({ tool }: { tool: McpTool }) => {
  useAssistantToolUI({
    toolName: tool.name,
    render: ({ args, status, result }) => {
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
        // Check if the result contains an error message
        const resultText = result?.content?.[0]?.text || '';
        const isError =
          resultText.includes('McpError:') ||
          resultText.includes('MCP error') ||
          resultText.includes('Error:') ||
          resultText.includes('Failed to');

        if (isError) {
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
