import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { ChromePortClientTransport } from './ExtensionClientTransport.js';

// Robust client with error handling
async function connectWithRetry() {
  let retries = 0;
  const maxRetries = 3;

  while (retries < maxRetries) {
    try {
      const port = chrome.runtime.connect({ name: 'mcp-client' });
      const transport = new ChromePortClientTransport(port, {
        autoReconnect: true,
      });

      const client = new Client({
        name: 'Resilient Client',
        version: '1.0.0',
      });

      await client.connect(transport);

      // Set up reconnection handler
      transport.onclose = () => {
        console.log('Connection lost, will auto-reconnect');
      };

      return { client, transport };
    } catch (error) {
      retries++;
      console.error(`Connection attempt ${retries} failed:`, error);

      if (retries >= maxRetries) {
        throw new Error('Failed to connect after multiple attempts');
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
    }
  }
}

// Create the port connection
const port = chrome.runtime.connect({ name: 'mcp-client-popup' });

// Create transport with auto-reconnect
const transport = new ChromePortClientTransport(port, {
  timeout: 5000,
  autoReconnect: true,
  reconnectDelay: 1000,
  maxReconnectAttempts: 5,
});

// Create client
const client = new Client({
  name: 'Chrome Extension Client',
  version: '1.0.0',
});

// Connect to the server
try {
  await client.connect(transport);
  console.log('Connected to MCP server');

  // Check server info and session
  console.log('Server info:', transport.serverInfo);
  console.log('Session ID:', transport.sessionId);

  // List available tools
  const tools = await client.listTools();
  console.log('Available tools:', tools);

  // Call a tool
  const activeTab = await client.callTool({
    name: 'get-active-tab',
    arguments: {},
  });
  console.log('Active tab:', activeTab);

  // List resources
  const resources = await client.listResources();
  console.log('Available resources:', resources);

  // Read a resource
  const bookmarks = await client.readResource({
    uri: 'chrome://bookmarks',
  });
  console.log('Bookmarks:', bookmarks);

  // Get a prompt
  const prompt = await client.getPrompt({
    name: 'analyze-page',
    arguments: {
      url: 'https://example.com',
    },
  });
  console.log('Prompt:', prompt);
} catch (error) {
  console.error('Failed to connect:', error);
}

// Handle disconnection
transport.onclose = () => {
  console.log('Disconnected from server');
};

// Handle errors
transport.onerror = (error) => {
  console.error('Transport error:', error);
};
