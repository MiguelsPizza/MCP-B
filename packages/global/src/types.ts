// types.ts

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

declare global {
  interface Window {
    mcp: McpServer;
  }
}

export type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
