### Connecting to Claude Desktop (via Proxy)

Claude Desktop primarily expects MCP servers via stdio transport. Since the native host exposes a Streamable HTTP endpoint (at `http://127.0.0.1:12306/mcp` by default), you'll need to use `mcp-remote` to bridge this to stdio.

#### Step 1: Make sure npx/npm is installed
Install npm if needed

Verify installation:
```bash
npx --version
```

#### Step 2: Configure in Claude Desktop
Open Claude Desktop > **Settings** > **Developer** > **Edit Config** (or manually edit `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS).

Add or merge this under `"mcpServers"` (adjust the URL/port if your native host uses a custom one):

```json
{
    "mcpServers": {
        "mcp-b-proxy": {
            "command": "npx",
            "args": [
                "mcp-remote",
                "http://127.0.0.1:12306/mcp"
            ]
        }
    }
}
```

Save and restart Claude Desktop. The proxy will start automatically when Claude needs it.

#### Step 3: Test the Connection
- Ensure the native host is running (`@mcp-b/native-host`) and your MCP-enabled site is open in Chrome with the extension.
- In Claude Desktop, open **Developer Tools** > **MCP Inspector** and test calling tools (they'll be prefixed with your site's domain).
- Check Claude's logs for errors (via console or file). If you see "ENOENT", double-check the full path in your config.

#### Troubleshooting
- **ENOENT Error**: Use the full path as shown. If issues persist, add `~/.local/bin` to your PATH and restart your shell/Claude.
- **Proxy Not Starting**: Test manually: `/path/to/mcp-proxy http://127.0.0.1:12306/mcp --transport=streamablehttp`.
- **No Tools Visible**: Ensure tabs with your MCP-enabled site are open; tools are discovered from active browser sessions.
- For upgrades: `uv tool upgrade --reinstall mcp-proxy`.

This setup allows Claude Desktop to interact with your website's tools via the browser, using the native host as a bridge. For other MCP clients supporting Streamable HTTP directly (e.g., Cursor), use the URL config from the previous section.