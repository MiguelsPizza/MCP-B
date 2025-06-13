# MCP React Hooks

This library provides a set of React hooks to simplify the integration of the [Model Context Protocol (MCP)](https://github.com/modelcontextprotocol/spec) in React applications. It handles state management, data fetching, and real-time updates from MCP servers, allowing you to focus on building your UI.

### Installation

```bash
npm install @mcp-b/mcp-react-hooks
```

### Quick Start

This example shows how to connect to an MCP server, which could be running in the same browser tab or in a browser extension's background script.

**1. Create the MCP Client & Transport**

It's crucial to create your `Client` and `Transport` instances _outside_ of the React component lifecycle to prevent re-connections on every render.

```typescript
// src/mcp.ts

// Import the specific transport you need
import { TabClientTransport } from '@mcp-b/transports'; // For in-page apps
import { Client } from '@modelcontextprotocol/sdk/client';

// OR
// import { ExtensionClientTransport } from '@mcp-b/transports'; // For extension UIs

// Create a single transport instance for your app
export const transport = new TabClientTransport('mcp', {
  clientInstanceId: 'my-awesome-app',
});

// Create a single client instance
export const mcpClient = new Client({
  name: 'MyAwesomeApp',
  version: '1.0.0',
});

// Note: The connection will be handled by the useMcpClient hook
```

**2. Wrap Your App with `McpProvider`**

In your main application file, wrap your components with the single, unified `McpProvider`.

```tsx
// src/App.tsx
import { McpProvider } from '@mcp-b/mcp-react-hooks';
import { mcpClient, transport } from './mcp';
import { MyComponent } from './MyComponent';

function App() {
  return (
    <McpProvider transport={transport} mcpClient={mcpClient}>
      <MyComponent />
    </McpProvider>
  );
}

export default App;
```

**3. Use the `useMcpClient` Hook**

Now you can access the MCP client, resources, tools, and connection state anywhere in your component tree. The hook automatically handles the connection for you.

```tsx
// src/MyComponent.tsx
import { useMcpClient } from '@mcp-b/mcp-react-hooks';

export function MyComponent() {
  const { client, resources, tools, isLoading, error, isConnected } = useMcpClient();

  if (isLoading) {
    return <div>Connecting to MCP Server...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!isConnected) {
    return <div>Not connected to MCP Server</div>;
  }

  // You can now use the client to call tools
  const handleToolCall = async () => {
    const result = await client.callTool({
      name: 'some-tool',
      arguments: { param: 'value' },
    });
    console.log(result);
  };

  return (
    <div>
      <h2>Available Tools</h2>
      <ul>
        {tools.map((tool) => (
          <li key={tool.name}>{tool.name}</li>
        ))}
      </ul>

      <h2>Available Resources</h2>
      <ul>
        {resources.map((resource) => (
          <li key={resource.uri}>
            {resource.name} ({resource.uri})
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### API Reference

#### `<McpProvider>`

A context provider that makes a connected MCP client available to all child components. It works with any type of MCP transport (e.g., `TabClientTransport`, `ExtensionClientTransport`).

**Props:**

- `mcpClient: Client`: An initialized `Client` instance (connection will be handled by the hook).
- `transport: Transport`: The transport instance to be used by the client.
- `children: ReactNode`: Your application's components.

#### `useMcpClient(opts?)`

A hook for accessing MCP client data and status. Must be used within an `<McpProvider>`. This hook automatically handles the connection to the MCP server.

**Parameters:**

- `opts?: RequestOptions` (optional): Request options to pass to the client connection.

**Returns:**

- `client: Client`: The raw MCP `Client` instance for making direct calls (e.g., `client.callTool(...)`).
- `resources: Resource[]`: An array of available resources. Automatically updates when the server sends a change notification.
- `tools: McpTool[]`: An array of available tools. Also updates automatically.
- `isLoading: boolean`: `true` during the initial connection and data fetch.
- `error: Error | null`: Any error that occurred during connection or data fetching.
- `connect: () => Promise<void>`: Function to manually trigger connection (usually not needed as connection happens automatically).
- `isConnected: boolean`: `true` when successfully connected to the MCP server.

#### `useMcpContext()`

A hook for accessing the raw MCP context, including the transport instance. Must be used within an `<McpProvider>`.

**Returns:**

- `mcpClient: Client`: The MCP `Client` instance.
- `transport: Transport`: The MCP `Transport` instance.
- `capabilities: ServerCapabilities | null`: The capabilities of the connected server.

#### `<McpServerProvider>`

A provider that makes a connected `McpServer` instance available to all child components.

**Props:**

- `server: McpServer`: An initialized and connected `McpServer` instance.
- `children: ReactNode`: Your application's components.

#### `useMcpServer()`

A hook for accessing the shared `McpServer` instance. This allows you to dynamically manage tools, resources, and prompts from within React components. It must be used within an `<McpServerProvider>`.

**Example: Dynamic Tool Registration**

The following component uses `useEffect` to register a tool when it mounts and automatically unregister it when it unmounts.

```tsx
import { useEffect } from 'react';
import { useMcpServer } from '@mcp-b/mcp-react-hooks';
import { z } from 'zod';

function DynamicGreeterTool() {
  const server = useMcpServer();

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
