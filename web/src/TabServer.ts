import { TabServerTransport } from '@mcp-b/transports';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

const transport = new TabServerTransport({
  allowedOrigins: ['*'],
});

const server = new McpServer({
  name: 'MyWebAppServer',
  version: '1.0.0',
});

server.tool(
  'ping',
  'Pings the server',
  {
    ping: z.string().describe('The ping message'),
  },
  async ({ ping }) => {
    return {
      content: [{ type: 'text', text: `Pong! ${ping}` }],
    };
  }
);

export { server, transport };
