# Connecting to the WebSocket Bridge

This guide explains how to connect MCP clients to your browser extension via the WebSocket bridge.

## Prerequisites

1. **Start the Bridge Server**:

   ```bash
   cd local-server
   pnpm bridge
   ```

   This starts the bridge on port 8888.

2. **Configure and Load the Extension**:
   - Set `new McpHub('ws')` in `extension/entrypoints/background/index.ts`
   - Build and load the extension in Chrome

## Connecting Different MCP Clients

### MCP Inspector

Since MCP Inspector only supports STDIO transport, you need to use the WebSocket-to-STDIO proxy that's included in the local-server:

```bash
# From the local-server directory
cd local-server

# Use the inspector with the proxy
npx @modelcontextprotocol/inspector node dist/index.js ws://localhost:8888

# Or if you haven't built yet:
npx @modelcontextprotocol/inspector tsx src/index.ts ws://localhost:8888
```

This creates the following connection chain:

```
MCP Inspector → STDIO → Proxy (index.js) → WebSocket → Bridge → Extension
```

### Claude Desktop

Add to your Claude Desktop configuration file (location varies by OS):

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "browser-extension": {
      "type": "websocket",
      "url": "ws://localhost:8888"
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json` in your project:

```json
{
  "mcpServers": {
    "browser-extension": {
      "type": "websocket",
      "url": "ws://localhost:8888"
    }
  }
}
```

### CLI Testing

You can also test the connection using the MCP Inspector CLI:

```bash
# List available tools
npx @modelcontextprotocol/inspector --cli ws://localhost:8888 --method tools/list

# Call a tool
npx @modelcontextprotocol/inspector --cli ws://localhost:8888 --method tools/call --tool-name tab1_createTodo --tool-arg title="Test Todo"
```

## Troubleshooting

1. **Connection Refused**:

   - Ensure the bridge server is running (`pnpm bridge` in local-server)
   - Check that the extension is loaded and set to 'ws' mode

2. **No Tools Available**:

   - Make sure you have tabs open with pages that register MCP tools
   - Check the extension's background page console for errors

3. **Port Conflicts**:
   - If port 8888 is in use, change it via environment variable:
     ```bash
     PORT=9999 pnpm bridge
     ```
   - Update the WebSocket URL accordingly in all configurations

## Architecture Flow

```
MCP Client (Inspector/Claude/etc.)
    ↓ (WebSocket)
Bridge Server (localhost:8888)
    ↓ (WebSocket with connectionId)
Browser Extension (acting as MCP Server)
    ↓ (Chrome Extension APIs)
Web Pages with MCP Tools
```

## Security Notes

- The bridge only binds to localhost by default
- Each client connection gets a unique connectionId for message routing
- The extension can handle multiple simultaneous client connections
