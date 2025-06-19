// Connect to another extension's MCP server
const port = chrome.runtime.connect('other-extension-id', { name: 'mcp-client-external' });

const transport = new ChromePortClientTransport(port, {
  extensionId: 'other-extension-id',
  timeout: 5000,
});
