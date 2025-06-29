# @mcp-b/mcp-react-hooks

React hooks and providers for the Model Context Protocol (MCP), designed for browser-based applications. This library provides a flexible architecture with three distinct providers for different use cases.

## Installation

```bash
npm install @mcp-b/mcp-react-hooks
```

## Architecture

This library provides three distinct providers for different use cases:

1. **McpClientProvider** - For consuming MCP tools from servers
2. **McpServerProvider** - For exposing MCP tools from your web application  
3. **McpMemoryProvider** - For applications that need both client and server with in-memory transport

## Usage

### Client Usage with McpClientProvider

Use `McpClientProvider` when you want to consume MCP tools from other servers:

```tsx
import { McpClientProvider, useMcpClient } from '@mcp-b/mcp-react-hooks';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { TabClientTransport } from '@mcp-b/transports';

// Create client and transport instances
const client = new Client({ name: 'MyApp', version: '1.0.0' });
const transport = new TabClientTransport('mcp', { clientInstanceId: 'my-app' });

function App() {
  return (
    <McpClientProvider client={client} transport={transport} opts={{}}>
      <ClientTools />
    </McpClientProvider>
  );
}

function ClientTools() {
  const { client, tools, isConnected, isLoading, error } = useMcpClient();
  
  const callTool = async (toolName: string, args: any) => {
    if (!client) return;
    
    const result = await client.callTool({
      name: toolName,
      arguments: args
    });
    
    console.log('Tool result:', result);
  };
  
  if (isLoading) return <div>Connecting...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h3>Available Tools: {tools.length}</h3>
      {tools.map(tool => (
        <div key={tool.name}>
          <h4>{tool.name}</h4>
          <p>{tool.description}</p>
        </div>
      ))}
    </div>
  );
}
```

### Server Usage with McpServerProvider

Use `McpServerProvider` when you want to expose MCP tools from your web application:

```tsx
import { McpServerProvider, useMcpServer } from '@mcp-b/mcp-react-hooks';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TabServerTransport } from '@mcp-b/transports';
import { z } from 'zod';

// Create server and transport instances
const server = new McpServer({ 
  name: 'MyWebAppServer', 
  version: '1.0.0',
  options: { instructions: 'A helpful web application server.' }
});
const transport = new TabServerTransport({ allowedOrigins: ['*'] });

function App() {
  return (
    <McpServerProvider server={server} transport={transport}>
      <ServerTools />
    </McpServerProvider>
  );
}

function ServerTools() {
  const { server, isConnected, registerTool, elicitInput } = useMcpServer();
  
  useEffect(() => {
    if (!isConnected) return;
    
    // Register a simple tool
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
    
    // Register a tool with user interaction
    const unregisterConfirm = registerTool(
      'confirm-action',
      {
        description: 'Perform an action with user confirmation',
        inputSchema: {
          action: z.string().describe('The action to perform')
        }
      },
      async ({ action }) => {
        // Ask user for confirmation
        const result = await elicitInput(
          `Do you want to proceed with: ${action}?`,
          {
            type: 'object',
            properties: {
              confirm: {
                type: 'boolean',
                title: 'Confirm',
                description: 'Proceed with the action?'
              },
              reason: {
                type: 'string',
                title: 'Reason (optional)',
                description: 'Why are you making this choice?'
              }
            },
            required: ['confirm']
          }
        );
        
        if (result.action === 'accept' && result.content?.confirm) {
          return {
            content: [{
              type: 'text',
              text: `Action "${action}" completed. Reason: ${result.content.reason || 'None provided'}`
            }]
          };
        }
        
        return {
          content: [{
            type: 'text',
            text: `Action "${action}" cancelled`
          }]
        };
      }
    );
    
    // Cleanup on unmount
    return () => {
      unregisterGreet();
      unregisterConfirm();
    };
  }, [isConnected, registerTool, elicitInput]);
  
  return <div>Server connected: {isConnected ? 'Yes' : 'No'}</div>;
}
```

### Combined Client & Server with McpMemoryProvider

Use `McpMemoryProvider` when you need both client and server in the same application:

```tsx
import { McpMemoryProvider, useMcpClient, useMcpServer } from '@mcp-b/mcp-react-hooks';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

const server = new McpServer({ name: 'MyServer', version: '1.0.0' });
const client = new Client({ name: 'MyClient', version: '1.0.0' });

function App() {
  return (
    <McpMemoryProvider server={server} client={client}>
      <MyApp />
    </McpMemoryProvider>
  );
}

function MyApp() {
  const { registerTool } = useMcpServer();
  const { client, tools } = useMcpClient();
  
  // Register tools on the server
  useEffect(() => {
    const unregister = registerTool(
      'addNumbers',
      {
        description: 'Adds two numbers',
        inputSchema: {
          a: z.number(),
          b: z.number()
        }
      },
      async ({ a, b }) => ({
        content: [{ type: 'text', text: `Result: ${a + b}` }]
      })
    );
    
    return () => unregister();
  }, [registerTool]);
  
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

## Integration with Assistant UI

This library works seamlessly with `@assistant-ui/react` for AI chat interfaces:

```tsx
import { useAssistantRuntime } from '@assistant-ui/react';
import { tool } from '@assistant-ui/react';
import { useMcpClient } from '@mcp-b/mcp-react-hooks';
import { McpTool } from '@modelcontextprotocol/sdk/types.js';

export function useAssistantMCP(mcpTools: McpTool[], client: Client): void {
  const runtime = useAssistantRuntime();
  
  useEffect(() => {
    if (!client || mcpTools.length === 0) return;
    
    // Convert MCP tools to assistant-ui tools
    const assistantTools = mcpTools.map((mcpTool) => ({
      name: mcpTool.name,
      assistantTool: tool({
        type: 'frontend',
        description: mcpTool.description,
        parameters: mcpTool.inputSchema,
        execute: async (args) => {
          const result = await client.callTool({
            name: mcpTool.name,
            arguments: args,
          });
          
          // Extract text content from MCP response
          const textContent = result.content
            .filter(c => c.type === 'text')
            .map(c => c.text)
            .join('\n');
            
          return { content: textContent };
        },
      }),
    }));
    
    // Register with assistant runtime
    const unregister = runtime.registerModelContextProvider({
      getModelContext: () => ({
        system: 'MCP Tools Available:',
        tools: Object.fromEntries(
          assistantTools.map((t) => [t.name, t.assistantTool])
        ),
      }),
    });
    
    return () => unregister();
  }, [client, mcpTools, runtime]);
}

// Usage in your chat component
function ChatWithMCP() {
  const { client, tools } = useMcpClient();
  
  // Bridge MCP tools to assistant-ui
  useAssistantMCP(tools, client);
  
  return <Thread />; // Your assistant-ui Thread component
}
```

## Real-World Examples

### Multiple Clients for Different UI Sections

```tsx
// Create separate clients for different parts of your app
const sidebarClient = new Client({ name: 'Sidebar', version: '1.0.0' });
const assistantClient = new Client({ name: 'Assistant', version: '1.0.0' });

function App() {
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <McpClientProvider client={sidebarClient} transport={sidebarTransport}>
        <AppSidebar />
      </McpClientProvider>
      <McpClientProvider client={assistantClient} transport={assistantTransport}>
        <MainChat />
      </McpClientProvider>
    </AssistantRuntimeProvider>
  );
}
```

### Browser Extension Integration

```tsx
import { ExtensionClientTransport } from '@mcp-b/transports';

// For Chrome extensions
const transport = new ExtensionClientTransport({ portName: 'mcp' });
const client = new Client({ name: 'Extension', version: '1.0.0' });

function ExtensionApp() {
  return (
    <McpClientProvider client={client} transport={transport} opts={{}}>
      <ExtensionUI />
    </McpClientProvider>
  );
}
```

### Dynamic Tool Registration

```tsx
function DynamicTools() {
  const { registerTool, isConnected } = useMcpServer();
  const [customTools, setCustomTools] = useState<(() => void)[]>([]);
  
  const addCustomTool = (name: string, description: string) => {
    if (!isConnected) return;
    
    const unregister = registerTool(
      name,
      {
        description,
        inputSchema: {
          input: z.string()
        }
      },
      async ({ input }) => ({
        content: [{ type: 'text', text: `Processed: ${input}` }]
      })
    );
    
    setCustomTools(prev => [...prev, unregister]);
  };
  
  // Cleanup all custom tools
  useEffect(() => {
    return () => {
      customTools.forEach(unregister => unregister());
    };
  }, [customTools]);
  
  return (
    <button onClick={() => addCustomTool(`tool-${Date.now()}`, 'Dynamic tool')}>
      Add Tool
    </button>
  );
}
```

## API Reference

### McpClientProvider

Props:
- `client: Client` - MCP client instance
- `transport: Transport` - Transport instance for the client
- `opts: RequestOptions` - Connection options (optional)

### McpServerProvider

Props:
- `server: McpServer` - MCP server instance
- `transport: Transport` - Transport instance for the server

### McpMemoryProvider

Props:
- `server: McpServer` - MCP server instance
- `client: Client` - MCP client instance

### useMcpClient()

Returns:
- `client: Client` - The MCP client instance
- `tools: McpTool[]` - Available tools
- `resources: Resource[]` - Available resources
- `isConnected: boolean` - Connection status
- `isLoading: boolean` - Loading state
- `error: Error | null` - Connection error if any
- `capabilities: ServerCapabilities | null` - Server capabilities
- `reconnect: () => Promise<void>` - Manual reconnection function

### useMcpServer()

Returns:
- `server: McpServer` - The MCP server instance
- `isConnected: boolean` - Connection status
- `isConnecting: boolean` - Currently connecting
- `error: Error | null` - Connection error if any
- `registerTool: (name, config, callback) => RegisteredTool` - Register a tool
- `elicitInput: (message, schema, options?) => Promise<ElicitResult>` - Request user input

## Transport Options

This library works with various transports from `@mcp-b/transports`:

- **TabServerTransport/TabClientTransport** - For communication between browser tabs
- **ExtensionClientTransport** - For Chrome extension communication
- **InMemoryTransport** - For client-server in same process

## Best Practices

1. **Create client/server instances outside components** to avoid recreation on re-renders
2. **Handle connection states** properly with isLoading and error states
3. **Clean up tools** using the unregister functions in useEffect cleanup
4. **Use proper error handling** when calling tools
5. **Implement elicitation handlers** on the client side for interactive workflows

## TypeScript Support

This library is written in TypeScript and provides full type safety for:
- Tool input/output schemas using Zod
- MCP protocol types
- React component props
- Hook return values