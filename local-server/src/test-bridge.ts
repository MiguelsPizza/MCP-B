#!/usr/bin/env node
import WebSocket from 'ws';

const bridgeUrl = 'ws://localhost:8021';

console.log(`Connecting to bridge at ${bridgeUrl}...`);

const ws = new WebSocket(bridgeUrl);

ws.on('open', () => {
  console.log('Connected to bridge as MCP client');

  // Send an initialize request
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '1.0.0',
      clientInfo: {
        name: 'test-client',
        version: '1.0.0',
      },
    },
  };

  console.log('Sending initialize request:', JSON.stringify(initRequest, null, 2));
  ws.send(JSON.stringify(initRequest));
});

ws.on('message', (data: Buffer) => {
  const message = JSON.parse(data.toString());
  console.log('Received message:', JSON.stringify(message, null, 2));

  // If we got an initialize response, send a tools/list request
  if (message.id === 1 && message.result) {
    const toolsRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {},
    };

    console.log('Sending tools/list request:', JSON.stringify(toolsRequest, null, 2));
    ws.send(JSON.stringify(toolsRequest));
  }
});

ws.on('error', (error: Error) => {
  console.error('WebSocket error:', error);
});

ws.on('close', () => {
  console.log('Disconnected from bridge');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nClosing connection...');
  ws.close();
  process.exit(0);
});
