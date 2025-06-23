#!/usr/bin/env node
import { McpWebSocketBridge } from './mcpProxy';

const port = process.env.PORT ? parseInt(process.env.PORT) : 8021;

// Start the WebSocket bridge
const bridge = new McpWebSocketBridge(port);

// console.log(`MCP WebSocket Bridge started on port ${port}`);
// console.log('Extensions can connect to: ws://localhost:' + port + '?type=extension');
// console.log('MCP clients can connect to: ws://localhost:' + port);

// Handle process termination
const shutdown = async () => {
  // console.log('\nShutting down bridge...');
  try {
    await bridge.shutdown();
    // console.log('Bridge shut down successfully');
    process.exit(0);
  } catch (error) {
    // console.error('Error shutting down bridge:', error);
    process.exit(1);
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  // console.error('Uncaught exception:', error);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  // console.error('Unhandled rejection at:', promise, 'reason:', reason);
  shutdown();
});
