# MCP-B: Browser-Native MCP for Websites

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/daohopfhkdelnpemnhlekblhnikhdhfa?style=flat-square&label=Chrome%20Extension)](https://chromewebstore.google.com/detail/mcp-b/daohopfhkdelnpemnhlekblhnikhdhfa)
[![npm version](https://img.shields.io/npm/v/@mcp-b/transports?style=flat-square)](https://www.npmjs.com/package/@mcp-b/transports)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/github/actions/workflow/status/MiguelsPizza/WebMCP/ci.yml?style=flat-square)](https://github.com/MiguelsPizza/WebMCP/actions)
[![GitHub stars](https://img.shields.io/github/stars/MiguelsPizza/WebMCP?style=flat-square)](https://github.com/MiguelsPizza/WebMCP/stargazers)

[🚀 Quick Start](#quick-start) • [✨ Live Demo](#live-demo) • [📚 Documentation](https://mcp-b.ai) • [🤝 Contributing](#contributing)

> MCP-B lets your website become an MCP server, exposing functionality as tools that AI agents can call directly—using the browser's existing authentication and security model.

## Live Demo

See MCP-B in action right away:

- **[Vanilla TypeScript Demo](./examples/vanilla-ts/)**: A simple todo app where MCP tools allow AI to manage tasks (e.g., add, update, delete todos). Run it locally: `cd examples/vanilla-ts && pnpm dev`. Visit the site, install the extension, and use the extension's chat or inspector to call tools like `getTodos` or `createTodo`.
- **[React E-commerce Demo](./examples/react-shop/)**: Demonstrates exposing shopping cart operations as MCP tools (e.g., `addToCart`, `getCurrentCart`). Run locally: `cd examples/react-shop && pnpm dev`. Tools update the UI in real-time, showing how AI can interact with your app's state.

These demos highlight how MCP-B integrates into websites without needing complex setups. Install the [MCP-B Chrome Extension](https://chromewebstore.google.com/detail/mcp-b/daohopfhkdelnpemnhlekblhnikhdhfa) to interact with the tools via the extension's chat interface or tool inspector.

## What is MCP-B?

MCP-B extends the Model Context Protocol (MCP) with browser-specific transports, allowing your website to act as an MCP server. Websites expose existing functionality (e.g., APIs, forms, or state) as structured tools that AI agents can call directly—no screen scraping, screenshots, or fragile automation required.

Key components:

- **Tab Transports**: Use `postMessage` for communication between your website's MCP server and clients in the same tab.
- **Extension Transports**: Use Chrome's runtime messaging for communication with browser extensions.

This setup enables AI to interact with your site deterministically, respecting user authentication (e.g., session cookies) and scoping tools to specific pages or user states.

## Why MCP-B?

Browser automation today relies on AI parsing visuals or DOMs to "click" elements, leading to slow, brittle workflows. MCP-B shifts to direct function calls:

| Traditional Automation                       | MCP-B                                           |
| -------------------------------------------- | ----------------------------------------------- |
| Slow round-trips for screenshots/DOM parsing | Fast, direct tool execution                     |
| Breaks on UI changes                         | Stable APIs tied to your app logic              |
| Black-box operations                         | Transparent, auditable calls with UI feedback   |
| Limited to visible elements                  | Full access to app state and authenticated APIs |

For developers: Add MCP-B to make your site AI-ready. Users with the extension get seamless automation without extra configuration.

## Quick Start

Get MCP-B running on your website in minutes. This guide focuses on adding an MCP server to expose tools, using the examples as a blueprint.

### Prerequisites

- Node.js 18+ and npm/pnpm.
- A website with JavaScript (vanilla, React, etc.).
- [MCP-B Chrome Extension](https://chromewebstore.google.com/detail/mcp-b/daohopfhkdelnpemnhlekblhnikhdhfa) installed for testing.

### Step 1: Install Dependencies

```bash
npm install @mcp-b/transports @modelcontextprotocol/sdk zod
```

### Step 2: Add an MCP Server to Your Website

Create a single MCP server instance and connect it via Tab Transport. Expose tools that wrap your existing logic.

Example (vanilla JS/TypeScript):

```typescript
import { TabServerTransport } from "@mcp-b/transports";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Create the server (one per site)
const server = new McpServer({
  name: "my-website",
  version: "1.0.0",
});

// Expose a tool (wrap your app's logic)
server.tool("getPageInfo", "Get current page info", {}, async () => {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          title: document.title,
          url: window.location.href,
        }),
      },
    ],
  };
});

// Connect the transport
await server.connect(new TabServerTransport({ allowedOrigins: ["*"] })); // Adjust origins for security
```

- **What this does**: The server listens for clients (e.g., the extension injects one). Tools like `getPageInfo` become callable by AI.
- **Tips**: Use Zod for input schemas. Add visual feedback (e.g., notifications) so users see AI actions.

### Step 3: Test It

1. Run your site (e.g., via a dev server).
2. Visit the page in Chrome with the MCP-B extension installed.
3. Open the extension popup:
   - Go to the "Tools" tab to see your exposed tools.
   - Use the chat interface to ask AI to call them (e.g., "Get the page info").
   - Or manually invoke via the inspector.

### Step 4: Explore Examples

The `./examples/` folder provides ready-to-run starters:

- **vanilla-ts**: Basic todo app. Tools: `createTodo`, `getTodos`, etc. Demonstrates dynamic tool registration and UI updates.

  - Run: `cd examples/vanilla-ts && pnpm dev`.
  - What it does: AI can manage todos, with tools scoped to the page state.

- **react-shop**: E-commerce cart demo. Tools: `addToCart`, `getCurrentCart`.
  - Run: `cd examples/react-shop && pnpm dev`.
  - What it does: Integrates with React state; tools fetch/update cart data using existing APIs.

Copy patterns from these to your site. Focus on wrapping client-side functions—e.g., use `fetch` with `credentials: 'same-origin'` for authenticated calls.

For more, see the [documentation](https://mcp-b.ai).

## Building the Extension from Source

For development builds:

1. Clone the repo: `git clone https://github.com/MiguelsPizza/WebMCP.git`.
2. Install: `cd WebMCP && pnpm install`.
3. Build the extension: `pnpm --filter extension build`.
4. Load in Chrome: Go to `chrome://extensions/`, enable Developer Mode, and load `./extension/.output/chrome-mv3`.

This gives you the latest features for testing your MCP server.

## Hooking Up the Native Host

To connect MCP-B to local MCP clients (e.g., Claude Desktop or Cursor) via a native host:

1. Install globally: `npm install -g @mcp-b/native-host`.
2. Run the host: `@mcp-b/native-host` (it starts a server on port 12306).

Add this to your MCP client config:

```json
{
  "type": "streamable-http",
  "url": "http://127.0.0.1:12306/mcp",
  "note": "For Streamable HTTP connections, add this URL directly in your MCP Client"
}
```

_Note_: The native server is mostly a clone of `mcp-chrome`. I plan to contribute it upstream when ready.

## Advanced Usage

- **Dynamic Tools**: Register/unregister tools based on page or user state (e.g., admin-only tools).
- **Tool Caching**: Annotate tools with `{ annotations: { cache: true } }` to persist across tabs.
- **Security**: Tools run in your page's context—only expose what you'd allow via UI. Use MCP's elicitation for sensitive ops (support coming soon).

## Repository Structure

```
WebMCP/
├── examples/                # Starter projects (vanilla-ts, react-shop)
├── packages/                # Core libs (@mcp-b/transports, etc.)
├── extension/               # Browser extension source
└── web/                     # Demo site and docs
```

## Development

```bash
git clone https://github.com/MiguelsPizza/WebMCP.git
cd WebMCP
pnpm install
pnpm dev  # Runs all in dev mode
```

## Contributing

Contributions welcome! Focus on transports, examples, or docs. See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Security & Trust

- Respects browser sandbox and same-origin policy.
- No data collection; runs locally.
- Audit tool calls via the extension.

## Roadmap

- Firefox/Safari support.
- Full MCP spec (beyond tools).
- Native host upstreaming.

## License

MIT - see [LICENSE](./LICENSE).

Created by [@miguelsPizza](https://github.com/miguelsPizza). Reach out: alexnahasdev@gmail.com.

[Website](https://mcp-b.ai) • [GitHub](https://github.com/MiguelsPizza/WebMCP)
