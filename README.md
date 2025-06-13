# MCP-B: Browser-based Model Context Protocol Transports

MCP-B implements custom transports for the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) that enable AI assistants to communicate with web applications and browser extensions.

## Overview

This monorepo provides:

- **Browser-native MCP transports** for in-tab and extension communication
- **React hooks** for easy MCP client integration
- **Demo application** showcasing todo management via MCP tools

## Key Features

### 🌐 Browser Transports
- `TabClientTransport` / `TabServerTransport` - Enable MCP communication within browser tabs
- Cross-context messaging between web apps, content scripts, and extension panels
- Full MCP protocol support in browser environments

### 🪝 React Integration
- `@mcp-b/mcp-react-hooks` - React hooks for MCP client functionality
- Works seamlessly with `@assistant-ui/react` for AI chat interfaces
- TypeScript-first with full type safety

### 🎯 Demo Application
- Full-stack todo app demonstrating MCP browser capabilities
- AI assistant that manages todos through MCP tools
- Real-time sync with Electric SQL

## Packages

- `packages/b-mcp` - Core browser transports for MCP
- `packages/mcp-react-hooks` - React hooks for MCP integration
- `extension` - Browser extension with MCP client
- `web` - Demo web app with MCP server

## Getting Started

```bash
# Install dependencies
pnpm install

# Run all packages in development
pnpm dev

# Build all packages
pnpm build
```

## Use Cases

- **AI-powered browser extensions** - Build extensions where AI can interact with web pages
- **In-page AI assistants** - Embed AI assistants that can control web app functionality
- **Cross-context communication** - Connect AI assistants across different browser contexts

## Documentation

See individual package READMEs for detailed documentation:
- [Browser Transports](./packages/b-mcp/README.md)
- [React Hooks](./packages/mcp-react-hooks/README.md)
- [Extension](./extension/README.md)
- [Web App](./web/README.md)

## License

MIT