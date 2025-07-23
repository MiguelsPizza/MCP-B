# MCP-B Native Server

A Chrome Native Messaging host for bridging browser extensions to local MCP clients.

## Attribution

This native server is based on [mcp-chrome](https://github.com/hangwin/mcp-chrome) by [hangwin](https://github.com/hangwin). We've adapted it for MCP-B with additional features like dual extension ID support and automated registration workflows.

## Features

- Bridges Chrome extensions to local MCP clients via Native Messaging
- HTTP server on port 12306 for MCP communication
- Supports both production and development extension IDs
- Automated manifest registration for development workflows
- Cross-platform support (macOS, Windows, Linux)

## Development

This package is part of the MCP-B monorepo. For development setup, see the main [README.md](../README.md).

### Key Scripts

- `pnpm run build` - Build the native server
- `pnpm run register:dev` - Register native messaging manifests for development
- `pnpm run dev` - Build and register for development (with file watching)

### Extension ID Configuration

The server supports both production and development extension IDs:
- Production: `mhipkdochajohklmmjinmicahanmldbj`
- Development: Configurable via `native-server/.env` file

## Architecture

The native server acts as a proxy between:
1. Local MCP clients (Claude Desktop, Cursor, etc.)
2. Browser extensions via Chrome Native Messaging
3. Web pages with MCP servers via the extension

This enables desktop AI applications to interact with tools exposed by websites through the browser's security context.

## License

MIT

## Credits

Based on [mcp-chrome](https://github.com/hangwin/mcp-chrome) by [hangwin](https://github.com/hangwin).