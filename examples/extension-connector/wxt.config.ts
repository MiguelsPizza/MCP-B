import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'MCP Connector Extension',
    description: 'Example extension that connects to MCP-B extension',
    version: '1.0.0',
    permissions: ['storage'],
  },
  runner: {
    startUrls: ['chrome://extensions'],
  },
});
