# MCP-Window: Model Context Protocol for Browser Windows

## Overview

MCP-Window is an adaptation of the [Model Context Protocol (MCP)](https://modelcontextprotocol.io) designed for seamless communication between a web page (acting as a "provider") and an LLM client/UI (acting as a "client") within the same browser window or trusted iframe.

Instead of relying on external server processes and complex transports (like stdio or HTTP/SSE), MCP-Window enables a web page to expose contextual information, tools, and prompts directly through a JavaScript object, typically `window.mcp`. The LLM client can then interact with this object to enhance its understanding and capabilities.

**Core Idea:** The host web page _provides_ context and functionality; the LLM client _consumes_ it.

## Why MCP-Window?

- **Simplicity:** Drastically simplifies integration by leveraging direct JavaScript object interaction.
- **Performance:** Direct function calls offer high performance with minimal overhead.
- **Contextual Awareness:** Allows LLMs to understand and interact with the specific content and functionality of the current web page.
- **Extensibility:** Web pages can dynamically add or remove available resources, tools, and prompts.
- **Standardization:** Provides a common pattern for web pages to offer rich context to in-browser LLM assistants.

## Key Concepts

MCP-Window mirrors the core primitives of the standard MCP:

1.  **Provider (`window.mcp`):**

    - An object injected by the host web page.
    - Implements the `WindowMcpApi` interface.
    - Exposes methods for the LLM client to discover and use features.
    - Acts as an `EventTarget` to notify the client of changes.

2.  **Client (LLM UI/Assistant):**

    - A JavaScript module or library within an LLM UI.
    - Detects and interacts with the `window.mcp` provider.
    - Uses the provider to fetch resources, call tools, and get prompts.
    - Listens for notifications from the provider.

3.  **Features:**

    - **Resources:** Data or content the provider makes available (e.g., page title, selected text, product information, DOM elements).
      - `listResources()`: Discover available resources.
      - `readResource({ uri })`: Get the content of a specific resource.
    - **Tools:** Executable functions the provider exposes (e.g., change page style, submit a form, add item to cart).
      - `listTools()`: Discover available tools.
      - `callTool({ name, arguments })`: Execute a tool with given arguments.
    - **Prompts:** Pre-defined templates or instructions to guide LLM interactions specific to the page's context.
      - `listPrompts()`: Discover available prompt templates.
      - `getPrompt({ name, arguments })`: Get the messages for a specific prompt, potentially with arguments.

4.  **Lifecycle & Information:**

    - `getServerInfo()`: Get information about the provider (name, version).
    - `getCapabilities()`: Get the capabilities supported by the provider (e.g., if it supports tools, resources, etc.).

5.  **Notifications:**
    - The provider can dispatch `CustomEvent`s (specifically `mcpNotification`) to inform the client about changes, such as:
      - `resourcesListChanged`
      - `toolsListChanged`
      - `promptsListChanged`
      - `resourceUpdated` (with the URI of the updated resource)

## Protocol Flow

### Initialization (Client-Side)

1.  The LLM client checks for the existence of `window.mcp` (or a configured namespace).
2.  If found, the client calls `getServerInfo()` and `getCapabilities()` on the provider to understand what it's connected to and what features are available.

### Feature Usage (Client-Initiated)

- **Listing:** The client calls `listResources()`, `listTools()`, or `listPrompts()` to discover what's available.
- **Interaction:**
  - To get data: `readResource({ uri: "some-uri" })`
  - To perform an action: `callTool({ name: "tool-name", arguments: { ... } })`
  - To get a prompt structure: `getPrompt({ name: "prompt-name", arguments: { ... } })`
  - All interaction methods are asynchronous and return Promises.

### Notifications (Provider-Initiated)

1.  The provider's internal state changes (e.g., a new tool becomes available, or a resource's content is updated).
2.  The provider dispatches an `mcpNotification` `CustomEvent` on itself (e.g., `window.mcp.dispatchEvent(...)`).
3.  The LLM client, if subscribed to these events, receives the notification and can react accordingly (e.g., re-list tools, re-read a resource).

## API Interface (`WindowMcpApi`)

The `window.mcp` object is expected to implement an interface similar to this (TypeScript):

```typescript
interface ServerInfo {
  name: string;
  version: string;
}
interface ServerCapabilities {
  /* ... */
}
// ... other types for Resource, Tool, Prompt, Results ...

interface WindowMcpApi extends EventTarget {
  getServerInfo: () => Promise<ServerInfo>;
  getCapabilities: () => Promise<ServerCapabilities>;

  listResources: () => Promise<ListResourcesResult>;
  readResource: (params: { uri: string }) => Promise<ReadResourceResult>;

  listTools: () => Promise<ListToolsResult>;
  callTool: (params: { name: string; arguments?: any }) => Promise<CallToolResult>;

  listPrompts: () => Promise<ListPromptsResult>;
  getPrompt: (params: { name: string; arguments?: any }) => Promise<GetPromptResult>;
}
```

(Refer to mcp-window-types.ts for detailed type definitions)

## SDK

To facilitate implementation, SDKs are envisioned for both providers and clients:

- `McpWindowProviderSDK`: A helper library for web pages to easily:
  - Create and manage the `window.mcp` object.
  - Register resources, tools, and prompts with their handlers.
  - Handle input validation (e.g., using Zod for tool arguments).
  - Dispatch notifications.
- `McpWindowClientSDK`: A helper library for LLM UIs to:
  - Connect to an existing `window.mcp` provider.
  - Provide convenient, typed methods for all API interactions.
  - Simplify event subscription for notifications.

## Example Usage

### Provider (Web Page):

```javascript
// Simplified example
const myPageProvider = new McpWindowProviderSDK(
  { name: 'MyWebApp', version: '0.1' },
  { resources: true, tools: true }
);

myPageProvider.addResource({ uri: 'page-data://current-url', name: 'Current URL' }, async () => ({
  contents: [{ uri: 'page-data://current-url', text: window.location.href }],
}));

myPageProvider.addTool(
  {
    name: 'showAlert',
    description: 'Shows a browser alert',
    inputSchemaDef: { message: z.string() },
  },
  async (args) => {
    alert(args.message);
    return { content: [{ type: 'text', text: 'Alert shown.' }] };
  }
);

myPageProvider.exposeOnWindow(); // Exposes as window.mcp
```

### Client (LLM UI):

```javascript
// Simplified example
const mcpClient = new McpWindowClientSDK();
await mcpClient.connect();

const tools = await mcpClient.listTools();
if (tools.tools.some((t) => t.name === 'showAlert')) {
  await mcpClient.callTool('showAlert', { message: 'Hello from the LLM!' });
}
```

## Security Considerations

Trust Model: MCP-Window typically operates within a same-origin or trusted-iframe context. The web page exposing window.mcp is implicitly trusted by the LLM client (or vice-versa, depending on how the components are loaded).

Provider Responsibility: The web page (provider) is responsible for:
Only exposing functionality and data it intends for the LLM to access.
Sanitizing any data received from the LLM client before using it, if applicable (though most interactions are client-consuming-provider).
Implementing its tool handlers securely.

Client Responsibility: The LLM client should:
Be aware that callTool can execute arbitrary JavaScript defined by the host page. This is generally the intent but implies trust.
Handle errors gracefully from provider calls.

Cross-Origin: If the LLM client is in an iframe from a different origin, direct window.mcp access is blocked by the Same-Origin Policy. In such scenarios, window.postMessage would be the required communication channel, and this MCP-Window protocol would need to be layered on top of postMessage (i.e., messages would be wrapped and sent/received via postMessage).

## Future Considerations

Argument and Schema Definition: Formalizing the inputSchema and outputSchema for tools and arguments for prompts using JSON Schema for better interoperability.

Pagination: For list\* methods if lists can become very large.

Resource Subscriptions: More granular updates beyond resourceUpdated (e.g., only if content changed in a specific way).

Completions API: For providing autocompletion hints for tool arguments or prompt arguments.

Standardized URI Schemes: Defining common URI schemes (e.g., dom://<css-selector>, page-text://).

## Contributing

This protocol is an idea under development. Feedback and contributions are welcome! Please open issues or pull requests on the relevant repository (if one exists) or start a discussion.

This README provides a good overview for someone wanting to understand or implement this in-window MCP variant. Remember to replace placeholders (like links to type definitions or SDK repositories) if you formalize this into actual files.
