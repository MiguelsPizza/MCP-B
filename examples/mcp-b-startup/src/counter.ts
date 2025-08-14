import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TabServerTransport } from '@mcp-b/transports';

import { z } from 'zod';

function createTransport(): TabServerTransport {
  const transport = new TabServerTransport({
    allowedOrigins: ['*'],
  });

  return transport;
}

export async function setupCounter(element: HTMLButtonElement) {
  const transport: TabServerTransport = createTransport();
  // const server = createMcpServer(element);

  const server = new McpServer({
    name: 'test-video',
    version: '1.0.0',
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  });

  let counter = 0;
  const setCounter = (count: number) => {
    counter = count;
    element.innerHTML = `count is ${counter}`;
  };

  // Initialize the counter display
  setCounter(0);

  // Add click handler for the button
  element.addEventListener('click', () => setCounter(counter + 1));

  server.registerTool(
    'incrementCounter',
    {
      inputSchema: {
        amount: z.number().optional().default(1),
      },
    },
    async ({ amount = 1 }) => {
      const newCount = counter + amount;
      setCounter(newCount);

      return {
        content: [
          {
            type: 'text',
            text: `Incremented counter by ${amount} to ${newCount}`,
          },
        ],
      };
    }
  );

  server.registerTool(
    'setCounter',
    {
      inputSchema: {
        value: z.string(),
      },
    },
    async ({ value }) => {
      setCounter(parseInt(value));

      return {
        content: [
          {
            type: 'text',
            text: `Set counter to ${value}`,
          },
        ],
      };
    }
  );

  server.registerTool(
    'getCounter',
    {
      inputSchema: {},
    },
    async () => {
      return {
        content: [
          {
            type: 'text',
            text: `Current counter value is ${counter}`,
          },
        ],
      };
    }
  );

  // Connect the server
  await server.connect(transport);

  return server;
}
