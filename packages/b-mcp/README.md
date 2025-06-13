# MCP Browser Transports

This library provides MCP `Transport` implementations for use in browser environments, enabling communication between MCP clients and servers within a web page or across a browser extension.

### Installation

```bash
npm install @mcp-b/transports
```

## Tab Transport (In-Page)

Use `TabServerTransport` and `TabClientTransport` when your MCP server and client are running in the same browser tab. The transport uses a `MessageChannel` and a global `window.mcp` object for communication.

### Quick Start: Tab Transport

**1. Server Setup**

Create an MCP server and connect it to a `TabServerTransport`. This will expose it on `window.mcp`.

```typescript
// my-mcp-server.js
import { TabServerTransport } from '@mcp-b/transports';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { z } from 'zod';

// 1. Create an MCP server
const server = new McpServer({
  name: 'WebAppServer',
  version: '1.0.0',
});

// 2. Add a tool
server.tool('add', { a: z.number(), b: z.number() }, async ({ a, b }) => ({
  content: [{ type: 'text', text: String(a + b) }],
}));

// 3. Create the transport and connect it to the server
const transport = new TabServerTransport();
await server.connect(transport);

console.log('MCP Tab Server is running.');
```

**2. Client Setup**

In your application code, create a client that connects to the server running on the page.

```typescript
// my-app.js
import { TabClientTransport } from '@mcp-b/transports';
import { Client } from '@modelcontextprotocol/sdk/client';

// 1. Create a transport that connects to the global 'mcp' namespace
const transport = new TabClientTransport('mcp', {
  clientInstanceId: 'my-web-app-client',
});

// 2. Create the client
const client = new Client({
  name: 'WebAppClient',
  version: '1.0.0',
});

// 3. Connect and use the client
await client.connect(transport);
const result = await client.callTool({
  name: 'add',
  arguments: { a: 5, b: 10 },
});

console.log('Result of add(5, 10):', result.content[0].text); // "15"
```

## Extension Transport

Use `ExtensionClientTransport` to allow a browser extension's UI (like a popup or sidebar) to communicate with an MCP server running in a page. This works via a relay through the extension's background script.

### Architecture

`Extension UI <-> Background Script <-> Content Script <-> Page Script`

### Quick Start: Extension Transport

**1. Background Script Setup (`background.ts`)**

Set up the central bridge to route messages between the extension UI and content scripts.

```typescript
import { setupBackgroundBridge } from '@mcp-b/transports/extension';

// This function listens for connections from UI and content scripts
// and relays messages between them.
setupBackgroundBridge();
```

**2. Content Script Setup (`contentScript.ts`)**

Inject a content script into the target page to relay messages between the page's `window` and the background script.

```typescript
import { mcpRelay } from '@mcp-b/transports/extension';

// The relay forwards messages from the page to the background script
// and vice-versa.
mcpRelay();
```

**3. Page Script Setup**

Your web application still needs to run a `TabServerTransport` as shown in the "Tab Transport" example above. The content script will automatically connect to it.

**4. Extension UI Client (`popup.tsx` or `sidebar.tsx`)**

Finally, your extension's UI can connect to the page's MCP server.

```typescript
import { ExtensionClientTransport } from '@mcp-b/transports';
import { Client } from '@modelcontextprotocol/sdk/client';

// 1. Use the ExtensionClientTransport in your UI code
const transport = new ExtensionClientTransport({
  clientInstanceId: 'my-extension-ui-client',
});

// 2. Create the MCP client
const client = new Client({
  name: 'MyExtensionUI',
  version: '1.0.0',
});

// 3. Connect and use the client
async function callPageTool() {
  try {
    await client.connect(transport);
    const result = await client.callTool({
      name: 'add',
      arguments: { a: 20, b: 22 },
    });
    console.log('Result from page tool:', result.content[0].text); // "42"
  } catch (error) {
    console.error('Failed to call tool via extension bridge:', error);
  }
}

callPageTool();
```
