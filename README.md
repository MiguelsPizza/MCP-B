# MCP-B: Browser-based Model Context Protocol

Bringing the power of the Model Context Protocol (MCP) to the browser, where work actually happens.

## The Problem

The Model Context Protocol has become the de facto standard for allowing LLMs to interact with the external world. But there's a critical gap: **most white-collar work happens in the browser**, yet MCP's solution has been to bypass browsers entirely and connect directly to APIs.

This creates two major issues:

1. **Authentication complexity** - MCP is essentially reinventing auth systems that browsers have already solved
2. **Poor agent experience** - Browser automation tools force LLMs to parse visual content and irrelevant HTML, degrading performance

## The Solution: MCP-B

MCP-B solves this by running MCP servers **directly inside web pages**, allowing AI agents to:

- Use existing browser authentication (cookies, sessions, OAuth)
- Access structured data through MCP tools instead of screen scraping
- Orchestrate workflows across multiple web applications
- Maintain security by operating within the browser's existing permission model

## How It Works

MCP-B introduces two new transport layers that enable MCP communication in browser environments:

### 🌐 Tab Transports

Run an MCP server directly on any webpage, exposing its functionality through standardized tools:

```typescript
// In your web app
import { TabServerTransport } from '@mcp-b/transports';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';

const server = new McpServer({
  name: 'TodoAppServer',
  version: '1.0.0',
});

// Expose your app's functionality as MCP tools
server.tool('createTodo', { text: z.string() }, async ({ text }) => {
  const todo = await createTodo(text);
  return { content: [{ type: 'text', text: `Created: ${todo.id}` }] };
});

// Connect to make it discoverable
const transport = new TabServerTransport();
await server.connect(transport);
```

### 🔌 Extension Transports

A browser extension that automatically discovers and connects to MCP servers on any page:

```typescript
// In your extension
import { ExtensionClientTransport } from '@mcp-b/transports';
import { Client } from '@modelcontextprotocol/sdk/client';

const transport = new ExtensionClientTransport({
  clientInstanceId: 'ai-assistant',
});

const client = new Client({
  name: 'BrowserAssistant',
  version: '1.0.0',
});

await client.connect(transport);
// Now your AI can interact with any page's MCP tools!
```

## Real-World Example

Imagine John, who works at a machine shop and receives an order for custom valves. His workflow involves:

1. **Email** - Send PO to accounting
2. **Internal IMS** - Check inventory for parts
3. **McMaster-Carr** - Order missing components
4. **Job Scheduler** - Register the work order
5. **Shipping Calculator** - Estimate delivery
6. **CRM** - Update customer with timeline

With MCP-B, each of these web apps exposes MCP tools. An AI assistant in the browser sidebar can:

- Navigate between all six applications
- Use existing authentication (no API keys needed)
- Execute the entire workflow through structured commands
- Maintain context across different domains

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Web Page      │     │ Content Script  │     │   Extension     │
│                 │     │                 │     │                 │
│ MCP Server      │<--->│     Relay      │<--->│  MCP Client    │
│ (Tab Transport) │     │                 │     │  + LLM Chat    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Packages

This monorepo includes:

| Package                                                | Description                             |
| ------------------------------------------------------ | --------------------------------------- |
| [`@mcp-b/transports`](./packages/MCP-B)                | Core browser transport implementations  |
| [`@mcp-b/mcp-react-hooks`](./packages/mcp-react-hooks) | React hooks for MCP integration         |
| [`extension`](./extension)                             | Chrome extension with AI chat interface |
| [`web`](./web)                                         | Demo todo app with MCP server           |

## Quick Start

### For Web Developers

Add MCP to your web app in minutes:

```bash
npm install @mcp-b/transports @modelcontextprotocol/sdk
```

Then expose your app's functionality through MCP tools. See the [transports documentation](./packages/MCP-B/README.md) for detailed examples.

### For Extension Users

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Build everything: `pnpm build`
4. Load the extension from `extension/dist`
5. Visit any MCP-B enabled site and watch the AI assistant connect automatically!

### Development

```bash
# Run all packages in development mode
pnpm dev

# Run specific packages
pnpm --filter web dev        # Web app only
pnpm --filter extension dev  # Extension only

# Type checking and linting
pnpm typecheck
pnpm lint
```

## Why This Matters

MCP-B represents a fundamental shift in how AI agents interact with web applications:

- **Security**: Leverage existing browser auth instead of managing API keys
- **Performance**: Structured data access instead of visual parsing
- **Compatibility**: Works with any web framework or application
- **User Control**: Agents operate within user permissions, not as service accounts

## Project Status

MCP-B is actively being developed. Current focus areas:

- ✅ Core transport implementations
- ✅ Chrome extension with chat interface
- ✅ Demo todo application
- 🚧 Firefox support
- 🚧 Desktop app bridge (connect to Claude Desktop, Cline, etc.)
- 📋 Additional example implementations

## Contributing

We're looking for contributors to help build out this vision! Areas where we need help:

- Building MCP servers for popular web apps
- Firefox extension support
- Desktop application bridges
- Security auditing
- Documentation and examples

Please check out our [contribution guide](./CONTRIBUTING.md) or reach out at alexmnahas@gmail.com

## License

MIT - See [LICENSE](./LICENSE) for details

---

_MCP-B is not affiliated with Anthropic or the official Model Context Protocol project._
