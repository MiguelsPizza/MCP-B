# Using MCP Inspector with the WebSocket Bridge

This guide provides a step-by-step process to connect MCP Inspector to your browser extension via the WebSocket bridge.

## Quick Start

Run this single command from the `local-server` directory:

```bash
pnpm inspect:bridge
```

This will start the MCP Inspector connected to your extension via the WebSocket bridge.

## Manual Steps

If you want to understand what's happening or customize the setup:

### 1. Start the WebSocket Bridge

```bash
cd local-server
pnpm bridge
```

This starts the bridge server on port 8021 that your extension will connect to.

### 2. Configure and Load the Extension

In `extension/entrypoints/background/index.ts`, ensure you have:

```typescript
new McpHub('ws'); // WebSocket mode
```

Then build and load the extension:

```bash
cd extension
pnpm build
# Load the extension in Chrome from extension/.output/chrome-mv3
```

### 3. Connect MCP Inspector

The MCP Inspector only supports STDIO transport, so we use the included proxy:

```bash
cd local-server
npx @modelcontextprotocol/inspector tsx src/index.ts ws://localhost:8021
```

## Connection Flow

```
┌─────────────────┐     STDIO      ┌─────────────┐    WebSocket    ┌────────────┐
│  MCP Inspector  │ ◄────────────► │    Proxy    │ ◄─────────────► │   Bridge   │
│  (STDIO only)   │                │  (index.ts) │                  │ (port 8021)│
└─────────────────┘                └─────────────┘                  └────────────┘
                                                                            │
                                                                       WebSocket
                                                                            │
                                                                            ▼
                                                                    ┌─────────────┐
                                                                    │  Extension  │
                                                                    │ (MCP Server)│
                                                                    └─────────────┘
```

## Available Scripts

From the `local-server` directory:

- `pnpm bridge` - Start the WebSocket bridge server
- `pnpm proxy ws://localhost:8021` - Start the STDIO proxy (for manual testing)
- `pnpm inspect:bridge` - Start MCP Inspector connected to the bridge (all-in-one)
- `pnpm test:bridge` - Test the bridge connection directly

## Troubleshooting

1. **"Port is already in use" error**:

   ```bash
   # Use different ports
   PORT=9999 pnpm bridge
   npx @modelcontextprotocol/inspector tsx src/index.ts ws://localhost:9999
   ```

2. **No tools showing in Inspector**:

   - Ensure the extension is loaded and set to 'ws' mode
   - Open some tabs with pages that register MCP tools
   - Check Chrome DevTools > Extensions > Background Page console for errors

3. **Connection refused**:
   - Make sure the bridge is running (`pnpm bridge`)
   - Verify the extension is loaded and connected (check background console)

## Custom Configurations

You can also use environment variables:

```bash
# Custom bridge port
PORT=9999 pnpm bridge

# Connect to custom port
WEBSOCKET_MCP_URL=ws://localhost:9999 npx @modelcontextprotocol/inspector tsx src/index.ts
```
