# MCP WebSocket Bridge

A WebSocket bridge that enables MCP (Model Context Protocol) clients to connect to browser extensions, solving the limitation that browser extensions cannot host WebSocket servers.

## Quick Start

```bash
# Start the bridge server (default port 8021)
npx @mcp-b/websocket-bridge

# Start with MCP Inspector
npx @mcp-b/websocket-bridge --with-inspector

# Custom port
npx @mcp-b/websocket-bridge --port 3002
```

## What It Does

The WebSocket bridge acts as an intermediary between MCP clients and browser extensions:

- **Bridge Server**: Hosts a WebSocket server that both clients and extensions connect to
- **Message Routing**: Routes messages between clients and extensions using connection IDs
- **Protocol Translation**: Includes a STDIO-to-WebSocket proxy for tools like MCP Inspector

## Architecture

```
MCP Client <-> WebSocket Bridge <-> Browser Extension
                (localhost:8021)         (MCP Hub)
```

1. Browser extensions connect as special clients with `?type=extension`
2. MCP clients connect normally to the WebSocket URL
3. The bridge assigns connection IDs and routes messages between them
4. Extensions appear as standard MCP servers to clients

## Commands

### `npx @mcp-b/websocket-bridge [options]`

Start the WebSocket bridge server.

Options:

- `-p, --port <port>` - Port to run on (default: 8021)
- `--with-inspector` - Also start MCP Inspector

### `npx @mcp-b/websocket-bridge stdio [options]`

Start both bridge server and STDIO proxy for MCP hosts (Claude Desktop, Cursor, etc).

Options:

- `-p, --port <port>` - Port to run on (default: 8021)

### `npx @mcp-b/websocket-bridge proxy <websocket-url>`

Start a STDIO-to-WebSocket proxy for connecting STDIO-only clients.

### `npx @mcp-b/websocket-bridge inspect [websocket-url]`

Start MCP Inspector connected to a WebSocket server.

## Connection URLs

When the bridge is running:

- **Extensions**: `ws://localhost:8021?type=extension`
- **MCP Clients**: `ws://localhost:8021`

## Usage with Browser Extension

1. Start the bridge:

   ```bash
   npx @mcp-b/websocket-bridge
   ```

2. Configure your browser extension to connect to the bridge in WebSocket mode

3. Connect MCP clients:
   - **Claude Desktop**: Use `ws://localhost:8021` in the config
   - **MCP Inspector**: Use `npx @mcp-b/websocket-bridge --with-inspector`
   - **Other clients**: Connect to `ws://localhost:8021`

## Example: Claude Desktop Configuration

Add to your Claude Desktop config file:

```json
{
  "mcpServers": {
    "browser-extension": {
      "command": "npx",
      "args": ["@mcp-b/websocket-bridge", "stdio"]
    }
  }
}
```

This will automatically:

1. Start the WebSocket bridge server on port 8021
2. Start the STDIO proxy connected to the bridge
3. Allow your browser extension to connect to `ws://localhost:8021?type=extension`

For manual setup (if you want to run the bridge separately):

```json
{
  "mcpServers": {
    "browser-extension": {
      "command": "npx",
      "args": ["@mcp-b/websocket-bridge", "proxy", "ws://localhost:8021"]
    }
  }
}
```

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Development mode
pnpm dev:bridge  # Start bridge in dev mode
pnpm dev:proxy   # Start proxy in dev mode
```

## How It Works

1. The bridge server accepts WebSocket connections on the specified port
2. Extensions identify themselves with the `?type=extension` query parameter
3. Each client connection receives a unique connection ID
4. Messages from clients are forwarded to extensions with the connection ID
5. Extensions respond with messages that include the connection ID
6. The bridge routes responses back to the appropriate client

This allows browser extensions to act as MCP servers without hosting their own WebSocket servers.
