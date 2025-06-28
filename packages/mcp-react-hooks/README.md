# MCP React Hooks

React hooks and providers for the Model Context Protocol (MCP), designed for browser-based applications. This library provides a flexible architecture with three distinct providers for different use cases.

## Installation

```bash
npm install @mcp-b/mcp-react-hooks
```

## Architecture

This library provides three distinct providers for different use cases:

1. **McpServerProvider** - For exposing MCP tools from your web application
2. **McpClientProvider** - For consuming MCP tools from other servers
3. **McpMemoryProvider** - For applications that need both client and server with in-memory transport

## Usage

### Server-Only Usage

Use `McpServerProvider` when you want to expose MCP tools from your web application:

```tsx
import { McpServerProvider, useMcpServer } from '@mcp-b/mcp-react-hooks';
import { TabServerTransport } from '@mcp-b/transports';
import { z } from 'zod';

function App() {
  const transport = new TabServerTransport({ allowedOrigins: ['*'] });
  
  return (
    <McpServerProvider
      serverConfig={{ name: 'MyWebApp', version: '1.0.0' }}
      transport={transport}
      options={{ instructions: 'A helpful web application server.' }}
    >
      <ServerTools />
    </McpServerProvider>
  );
}

function ServerTools() {
  const { server, isConnected, registerTool, elicitInput } = useMcpServer();
  
  useEffect(() => {
    if (!isConnected) return;
    
    // Register tools using the convenience function
    const unregisterGreet = registerTool(
      'greet',
      {
        description: 'Greets a user by name',
        inputSchema: {
          name: z.string().describe('The name to greet')
        }
      },
      async ({ name }) => ({
        content: [{ type: 'text', text: `Hello, ${name}!` }]
      })
    );
    
    // Register a tool that uses elicitation
    const unregisterBooking = registerTool(
      'book-restaurant',
      {
        description: 'Book a restaurant reservation',
        inputSchema: {
          restaurant: z.string(),
          date: z.string(),
          partySize: z.number()
        }
      },
      async ({ restaurant, date, partySize }) => {
        // Check availability (mock)
        const available = Math.random() > 0.5;
        
        if (!available) {
          // Ask user for alternative dates
          const result = await elicitInput(
            `No tables available at ${restaurant} on ${date}. Would you like to check alternative dates?`,
            {
              type: 'object',
              properties: {
                checkAlternatives: {
                  type: 'boolean',
                  title: 'Check alternative dates',
                  description: 'Would you like me to check other dates?'
                },
                flexibleDates: {
                  type: 'string',
                  title: 'Date flexibility',
                  description: 'How flexible are your dates?',
                  enum: ['next_day', 'same_week', 'next_week']
                }
              },
              required: ['checkAlternatives']
            }
          );
          
          if (result.action === 'accept' && result.content?.checkAlternatives) {
            return {
              content: [{
                type: 'text',
                text: `Found alternative dates based on ${result.content.flexibleDates} preference`
              }]
            };
          }
          
          return {
            content: [{
              type: 'text',
              text: 'No booking made. Original date not available.'
            }]
          };
        }
        
        return {
          content: [{
            type: 'text',
            text: `Booked table for ${partySize} at ${restaurant} on ${date}`
          }]
        };
      }
    );
    
    return () => {
      unregisterGreet();
      unregisterBooking();
    };
  }, [isConnected, registerTool, elicitInput]);
  
  return <div>Server connected: {isConnected ? 'Yes' : 'No'}</div>;
}
```

### Client-Only Usage

Use `McpClientProvider` when you want to consume MCP tools from other servers:

```tsx
import { McpClientProvider, useMcpClient } from '@mcp-b/mcp-react-hooks';
import { TabClientTransport } from '@mcp-b/transports';

function App() {
  const transport = new TabClientTransport('mcp', { clientInstanceId: 'my-app' });
  
  return (
    <McpClientProvider
      clientConfig={{ name: 'MyClient', version: '1.0.0' }}
      transport={transport}
    >
      <ClientTools />
    </McpClientProvider>
  );
}

function ClientTools() {
  const { client, tools, isConnected, isLoading } = useMcpClient();
  
  const callTool = async () => {
    const result = await client.callTool({
      name: 'greet',
      arguments: { name: 'World' }
    });
    console.log('Result:', result);
  };
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <h3>Available Tools: {tools.length}</h3>
      <button onClick={callTool}>Call Tool</button>
    </div>
  );
}
```

### Combined Client & Server

Use `McpMemoryProvider` when you need both client and server in the same application:

```tsx
import { McpMemoryProvider, useMcpClient, useMcpServer } from '@mcp-b/mcp-react-hooks';

function App() {
  return (
    <McpMemoryProvider
      serverConfig={{ name: 'MyServer', version: '1.0.0' }}
      clientConfig={{ name: 'MyClient', version: '1.0.0' }}
      serverOptions={{ instructions: 'A helpful assistant.' }}
    >
      <MyApp />
    </McpMemoryProvider>
  );
}

function MyApp() {
  const { server } = useMcpServer();
  const { client, tools } = useMcpClient();
  
  // Register tools on the server
  useEffect(() => {
    const unregister = server.tool(
      'addNumbers',
      'Adds two numbers',
      {
        a: z.number(),
        b: z.number()
      },
      async ({ a, b }) => ({
        content: [{ type: 'text', text: `Result: ${a + b}` }]
      })
    );
    
    return () => unregister();
  }, [server]);
  
  // Call tools with the client
  const testAddition = async () => {
    const result = await client.callTool({
      name: 'addNumbers',
      arguments: { a: 5, b: 3 }
    });
    console.log(result);
  };
  
  return (
    <div>
      <p>Tools: {tools.length}</p>
      <button onClick={testAddition}>Test Addition</button>
    </div>
  );
}
```

## API Reference

### McpServerProvider

Props:
- `serverConfig: { name: string; version: string }` - Server identification
- `transport: Transport` - Transport instance for the server
- `options?: { instructions?: string }` - Optional server configuration

### McpClientProvider

Props:
- `clientConfig: { name: string; version: string }` - Client identification
- `transport: Transport` - Transport instance for the client

### McpMemoryProvider

Props:
- `serverConfig: { name: string; version: string }` - Server identification
- `clientConfig: { name: string; version: string }` - Client identification
- `serverOptions?: { instructions?: string }` - Optional server configuration

### useMcpServer()

Returns:
- `server: McpServer` - The MCP server instance
- `isConnected: boolean` - Connection status
- `error: Error | null` - Connection error if any
- `elicitInput: (message, schema, options?) => Promise<ElicitResult>` - Elicit input from the user
- `registerTool: (name, config, callback) => () => void` - Register a tool and get unregister function

### useMcpClient()

Returns:
- `client: Client` - The MCP client instance
- `tools: McpTool[]` - Available tools
- `resources: Resource[]` - Available resources
- `isConnected: boolean` - Connection status
- `isLoading: boolean` - Loading state
- `error: Error | null` - Connection error if any
- `capabilities: ServerCapabilities | null` - Server capabilities

## Elicitation Support

The server can elicit input from users through the client. This is useful for interactive workflows where the server needs user input or confirmation:

```tsx
function InteractiveTools() {
  const { registerTool, elicitInput, isConnected } = useMcpServer();

  useEffect(() => {
    if (!isConnected) return;

    const unregister = registerTool(
      'configure-settings',
      {
        description: 'Configure application settings interactively',
        inputSchema: {
          setting: z.string().describe('The setting to configure')
        }
      },
      async ({ setting }) => {
        // Ask user for the new value
        const result = await elicitInput(
          `What value would you like to set for "${setting}"?`,
          {
            type: 'object',
            properties: {
              value: {
                type: 'string',
                title: 'New Value',
                description: `Enter the new value for ${setting}`
              },
              persist: {
                type: 'boolean',
                title: 'Save to disk',
                description: 'Should this setting be saved permanently?',
                default: true
              }
            },
            required: ['value']
          }
        );

        if (result.action === 'accept') {
          const { value, persist } = result.content!;
          // Apply the setting
          return {
            content: [{
              type: 'text',
              text: `Set ${setting} to "${value}"${persist ? ' and saved to disk' : ''}`
            }]
          };
        } else if (result.action === 'cancel') {
          return {
            content: [{
              type: 'text',
              text: 'Configuration cancelled by user'
            }]
          };
        } else {
          return {
            content: [{
              type: 'text',
              text: 'Configuration rejected'
            }]
          };
        }
      }
    );

    return unregister;
  }, [isConnected, registerTool, elicitInput]);

  return null;
}
```

### Elicitation Response Actions

The client can respond with three different actions:
- `accept`: User provided the requested input (includes `content` field)
- `reject`: User explicitly rejected the request
- `cancel`: User cancelled the interaction

## Integration with Assistant UI

This library works seamlessly with `@assistant-ui/react`:

```tsx
import { useAssistantRuntime } from '@assistant-ui/react';
import { tool } from '@assistant-ui/react';
import { useMcpClient } from '@mcp-b/mcp-react-hooks';

function AssistantIntegration() {
  const { client, tools } = useMcpClient();
  const runtime = useAssistantRuntime();
  
  useEffect(() => {
    if (!client || tools.length === 0) return;
    
    // Convert MCP tools to assistant-ui tools
    const assistantTools = tools.map((mcpTool) => ({
      name: mcpTool.name,
      assistantTool: tool({
        type: 'frontend',
        description: mcpTool.description,
        parameters: mcpTool.inputSchema,
        execute: (args) => client.callTool({
          name: mcpTool.name,
          arguments: args,
        }),
      }),
    }));
    
    // Register with assistant runtime
    const unregister = runtime.registerModelContextProvider({
      getModelContext: () => ({
        system: 'MCP Tools:',
        tools: Object.fromEntries(
          assistantTools.map((t) => [t.name, t.assistantTool])
        ),
      }),
    });
    
    return () => unregister();
  }, [client, tools, runtime]);
  
  return <div>Tools registered: {tools.length}</div>;
}
```

## Migration from Legacy API

If you're using the old `McpProvider` and `useMcpClient` from `McpContext`, they are still available for backward compatibility:

```tsx
// Old API (still works)
import { McpProvider, useMcpClient } from '@mcp-b/mcp-react-hooks';

// New API (recommended)
import { McpClientProvider, useMcpClient } from '@mcp-b/mcp-react-hooks';
```

The main difference is that the new providers handle the connection lifecycle automatically, while the old API required manual connection management.

## Legacy Examples

### Using McpServerProvider (Legacy)

The following example shows the legacy pattern of creating and connecting a server before passing it to the provider:

```tsx
import { useEffect } from 'react';
import { McpServerProvider, useMcpServer } from '@mcp-b/mcp-react-hooks';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { TabServerTransport } from '@mcp-b/transports';
import { z } from 'zod';

// Create and connect server outside React
const server = new McpServer({ name: 'MyWebAppServer', version: '1.0.0' });
const transport = new TabServerTransport();
await server.connect(transport);

function App() {
  return (
    <McpServerProvider server={server}>
      <DynamicGreeterTool />
    </McpServerProvider>
  );
}

function DynamicGreeterTool() {
  const { server } = useMcpServer();

  useEffect(() => {
    console.log('Registering "greet" tool...');
    const registeredTool = server.tool(
      'greet',
      'Responds with a greeting.',
      { name: z.string().describe('The name to greet') },
      async ({ name }) => {
        return {
          content: [{ type: 'text', text: `Hello, ${name}!` }],
        };
      }
    );

    // The cleanup function from useEffect will run when the component unmounts
    return () => {
      console.log('Unregistering "greet" tool...');
      registeredTool.remove();
    };
  }, [server]); // Re-run effect only if the server instance changes

  return <div>The "greet" tool is currently available.</div>;
}
```
