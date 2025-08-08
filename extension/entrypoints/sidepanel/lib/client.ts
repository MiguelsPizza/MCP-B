import { ExtensionClientTransport } from '@mcp-b/transports';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

export const transport = new ExtensionClientTransport({
  portName: 'mcp',
  autoReconnect: true,
});

export const client = new Client({
  name: 'Extension Sidepanel',
  version: '1.0.0',
});
