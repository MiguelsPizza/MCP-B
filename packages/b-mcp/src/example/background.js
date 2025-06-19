import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ChromePortServerTransport } from './ExtensionServerTransport.js';

// Create the MCP server
const server = new McpServer({
  name: 'Chrome Extension MCP',
  version: '1.0.0',
});

// Add tools
server.tool('get-active-tab', {}, async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            title: tab.title,
            url: tab.url,
            id: tab.id,
          },
          null,
          2
        ),
      },
    ],
  };
});

server.tool(
  'execute-script',
  {
    tabId: z.number(),
    code: z.string(),
  },
  async ({ tabId, code }) => {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: (code) => eval(code),
        args: [code],
      });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results[0].result),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Add resources
server.resource('bookmarks', 'chrome://bookmarks', async (uri) => {
  const bookmarks = await chrome.bookmarks.getTree();
  return {
    contents: [
      {
        uri: uri.href,
        text: JSON.stringify(bookmarks, null, 2),
      },
    ],
  };
});

// Add prompts
server.prompt('analyze-page', { url: z.string() }, ({ url }) => ({
  messages: [
    {
      role: 'user',
      content: {
        type: 'text',
        text: `Please analyze this webpage: ${url}\n\nProvide insights about its content, structure, and purpose.`,
      },
    },
  ],
}));

// Add tools dynamically based on permissions
chrome.permissions.onAdded.addListener((permissions) => {
  if (permissions.permissions?.includes('downloads')) {
    server.tool('list-downloads', {}, async () => {
      const downloads = await chrome.downloads.search({});
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(downloads, null, 2),
          },
        ],
      };
    });
  }
});

// For simpler use cases without session persistence
const transport = new ChromePortServerTransport({
  serverInfo: {
    name: 'Stateless MCP Server',
    version: '1.0.0',
  },
  capabilities: {
    tools: {},
    resources: {},
  },
  // No sessionIdGenerator = stateless mode
});

// Connect the server to the transport
await server.connect(transport);

// The transport will automatically handle incoming connections
console.log('Chrome Extension MCP Server running in background');
