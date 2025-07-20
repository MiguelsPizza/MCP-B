import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { setupTools } from './register-tools';

export let mcpServer: McpServer | null = null;

export const getMcpServer = () => {
  if (mcpServer) {
    return mcpServer;
  }
  mcpServer = new McpServer(
    {
      name: 'ChromeMcpServer',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );
  setupTools(mcpServer);
  return mcpServer;
};
