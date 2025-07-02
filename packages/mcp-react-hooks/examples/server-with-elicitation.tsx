import { McpServerProvider, useMcpServer } from '@mcp-b/mcp-react-hooks';
import { TabServerTransport } from '@mcp-b/transports';
import { useEffect } from 'react';
import { z } from 'zod';

// Example showing all new server features
function EnhancedServerExample() {
  const transport = new TabServerTransport();

  return (
    <McpServerProvider
      serverConfig={{ name: 'EnhancedServer', version: '1.0.0' }}
      transport={transport}
      options={{
        instructions: 'A server demonstrating elicitation and improved tool registration.',
      }}
    >
      <ServerWithElicitation />
    </McpServerProvider>
  );
}

function ServerWithElicitation() {
  const { server, isConnected, error, registerTool, elicitInput } = useMcpServer();

  useEffect(() => {
    if (!isConnected) return;

    // Example 1: Simple tool registration with cleanup
    const unregisterCalculator = registerTool(
      'calculate',
      {
        title: 'Calculator',
        description: 'Perform mathematical calculations',
        inputSchema: {
          expression: z.string().describe('Mathematical expression to evaluate'),
        },
        outputSchema: {
          result: z.number(),
          expression: z.string(),
        },
      },
      async ({ expression }) => {
        try {
          // Note: In production, use a safe math evaluator
          const result = eval(expression);
          return {
            content: [{ type: 'text', text: `${expression} = ${result}` }],
            structuredContent: { result, expression },
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: Invalid expression` }],
            isError: true,
          };
        }
      }
    );

    // Example 2: Tool with elicitation for user confirmation
    const unregisterFileOperation = registerTool(
      'delete-file',
      {
        description: 'Delete a file with user confirmation',
        inputSchema: {
          path: z.string().describe('Path to the file to delete'),
        },
      },
      async ({ path }) => {
        // Ask user for confirmation
        const result = await elicitInput(`Are you sure you want to delete the file "${path}"?`, {
          type: 'object',
          properties: {
            confirm: {
              type: 'boolean',
              title: 'Confirm deletion',
              description: 'This action cannot be undone',
            },
            createBackup: {
              type: 'boolean',
              title: 'Create backup',
              description: 'Create a backup before deleting?',
              default: true,
            },
          },
          required: ['confirm'],
        });

        if (result.action === 'accept' && result.content?.confirm) {
          const backupMsg = result.content.createBackup ? ' (backup created)' : '';
          return {
            content: [
              {
                type: 'text',
                text: `File "${path}" deleted successfully${backupMsg}`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: `File deletion cancelled`,
            },
          ],
        };
      }
    );

    // Example 3: Interactive configuration tool
    const unregisterConfig = registerTool(
      'configure-app',
      {
        description: 'Configure application settings interactively',
        inputSchema: {
          category: z.enum(['general', 'advanced', 'security']).describe('Configuration category'),
        },
        annotations: {
          featured: true,
          requiresAuth: true,
        },
      },
      async ({ category }) => {
        // Different schemas based on category
        const schemas = {
          general: {
            type: 'object' as const,
            properties: {
              theme: {
                type: 'string' as const,
                enum: ['light', 'dark', 'auto'],
                title: 'Theme',
                default: 'auto',
              },
              language: {
                type: 'string' as const,
                enum: ['en', 'es', 'fr', 'de'],
                title: 'Language',
                default: 'en',
              },
            },
          },
          advanced: {
            type: 'object' as const,
            properties: {
              debugMode: {
                type: 'boolean' as const,
                title: 'Debug Mode',
                default: false,
              },
              maxConnections: {
                type: 'number' as const,
                title: 'Max Connections',
                minimum: 1,
                maximum: 100,
                default: 10,
              },
            },
          },
          security: {
            type: 'object' as const,
            properties: {
              twoFactor: {
                type: 'boolean' as const,
                title: 'Two-Factor Authentication',
                default: true,
              },
              sessionTimeout: {
                type: 'number' as const,
                title: 'Session Timeout (minutes)',
                minimum: 5,
                maximum: 1440,
                default: 30,
              },
            },
          },
        };

        const schema = schemas[category];
        const result = await elicitInput(`Configure ${category} settings:`, schema);

        if (result.action === 'accept') {
          const settings = JSON.stringify(result.content, null, 2);
          return {
            content: [
              {
                type: 'text',
                text: `Settings updated:\n${settings}`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: 'Configuration cancelled',
            },
          ],
        };
      }
    );

    // Clean up all tools on unmount
    return () => {
      unregisterCalculator();
      unregisterFileOperation();
      unregisterConfig();
    };
  }, [isConnected, registerTool, elicitInput]);

  // You can also register tools dynamically
  const handleAddCustomTool = () => {
    if (!isConnected) return;

    const unregister = registerTool(
      `custom-tool-${Date.now()}`,
      {
        description: 'A dynamically added tool',
        inputSchema: {
          input: z.string(),
        },
      },
      async ({ input }) => ({
        content: [{ type: 'text', text: `Processed: ${input}` }],
      })
    );

    // Store unregister function somewhere for later cleanup
    console.log('Added custom tool, unregister function:', unregister);
  };

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <h2>Enhanced MCP Server</h2>
      <p>Status: {isConnected ? 'Connected' : 'Connecting...'}</p>
      <button onClick={handleAddCustomTool} disabled={!isConnected}>
        Add Custom Tool
      </button>

      {/* You can also access the raw server instance for advanced usage */}
      <button
        onClick={() => {
          if (isConnected) {
            server.sendToolListChanged();
          }
        }}
        disabled={!isConnected}
      >
        Notify Tool List Changed
      </button>
    </div>
  );
}

export default EnhancedServerExample;
