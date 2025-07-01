#!/usr/bin/env node
import { WebSocketClientTransport } from '@modelcontextprotocol/sdk/client/websocket.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';

// Get WebSocket URL from command line or environment
const wsUrl = (process.argv[2] || process.env.WEBSOCKET_MCP_URL) ?? 'ws://localhost:8021';

if (!wsUrl) {
  console.error('Usage: node websocket-to-stdio-proxy.js <websocket-url>');
  console.error('Or set WEBSOCKET_MCP_URL environment variable');
  process.exit(1);
}

console.error(`WebSocket-to-STDIO proxy starting...`);
console.error(`Will connect to WebSocket MCP server at: ${wsUrl}`);

let wsClient: WebSocketClientTransport | null = null;
let stdioServer: StdioServerTransport | null = null;
let isConnected = false;
let reconnectTimeout: NodeJS.Timeout | null = null;
let isShuttingDown = false;

// Queue for messages received while WebSocket is disconnected
const messageQueue: JSONRPCMessage[] = [];

async function connectWebSocket(): Promise<void> {
  if (isConnected || isShuttingDown) return;

  try {
    console.error(`Attempting to connect to WebSocket server at: ${wsUrl}`);

    // Create WebSocket client transport to connect to remote server
    wsClient = new WebSocketClientTransport(new URL(wsUrl));

    // Set up message handlers before connecting
    wsClient.onmessage = async (message: JSONRPCMessage) => {
      console.error(`← Server to Client: ${JSON.stringify(message, null, 2) || 'response'}`);

      // Enhanced logging for responses
      if ('result' in message || 'error' in message) {
        console.error('📨 Response detected:');
        if ('result' in message) {
          console.error(`  Result: ${JSON.stringify(message.result, null, 2)}`);
        }
        if ('error' in message) {
          console.error(`  Error: ${JSON.stringify(message.error, null, 2)}`);
        }
      }

      try {
        if (stdioServer) {
          await stdioServer.send(message);
        }
      } catch (error) {
        console.error('Error sending to STDIO client:', error);
      }
    };

    // Handle connection errors
    wsClient.onerror = (error) => {
      console.error('WebSocket error:', error);
      isConnected = false;
      scheduleReconnect();
    };

    // Handle WebSocket server disconnect
    wsClient.onclose = () => {
      console.error('WebSocket server disconnected');
      isConnected = false;
      scheduleReconnect();
    };

    // Start the WebSocket connection
    await wsClient.start();
    isConnected = true;
    console.error('✓ Connected to WebSocket server');

    // Send any queued messages
    while (messageQueue.length > 0) {
      const message = messageQueue.shift()!;
      try {
        await wsClient.send(message);
      } catch (error) {
        console.error('Error sending queued message:', error);
        // Put it back in the queue
        messageQueue.unshift(message);
        break;
      }
    }
  } catch (error) {
    console.error('Failed to connect to WebSocket server:', error);
    isConnected = false;
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (isShuttingDown) return;

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }

  console.error('Will retry WebSocket connection in 5 seconds...');
  reconnectTimeout = setTimeout(() => {
    connectWebSocket();
  }, 5000);
}

async function main() {
  try {
    // Create STDIO server transport to expose to local clients
    stdioServer = new StdioServerTransport();

    // Start STDIO server first (it can accept connections immediately)
    await stdioServer.start();
    console.error('✓ STDIO server started');
    console.error('Ready for STDIO client connections');

    // Relay messages from STDIO client to WebSocket server
    stdioServer.onmessage = async (message: JSONRPCMessage) => {
      console.error(`→ Client to Server: ${JSON.stringify(message, null, 2) || 'response'}`);

      // Enhanced logging for tool calls
      if ('method' in message && message.method === 'tools/call') {
        console.error('🔧 Tool call detected:');
        console.error(`  Method: ${message.method}`);
        console.error(`  Params: ${JSON.stringify(message.params, null, 2)}`);
        if (message.params && 'arguments' in message.params) {
          console.error(`  Arguments: ${JSON.stringify(message.params.arguments, null, 2)}`);
        }
      }

      if (isConnected && wsClient) {
        try {
          await wsClient.send(message);
        } catch (error) {
          console.error('Error sending to WebSocket server:', error);
          isConnected = false;
          messageQueue.push(message);
          scheduleReconnect();
        }
      } else {
        console.error('WebSocket not connected, queueing message...');
        messageQueue.push(message);

        // If we're not already trying to connect, start now
        if (!reconnectTimeout) {
          connectWebSocket();
        }
      }
    };

    stdioServer.onerror = (error) => {
      console.error('STDIO error:', error);
    };

    stdioServer.onclose = () => {
      console.error('STDIO client disconnected');
      shutdown();
    };

    // Start WebSocket connection
    await connectWebSocket();
  } catch (error) {
    console.error('Failed to start proxy:', error);
    process.exit(1);
  }
}

// Handle process termination
const shutdown = async () => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.error('\nShutting down proxy...');

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }

  try {
    if (wsClient) {
      await wsClient.close();
    }
    if (stdioServer) {
      await stdioServer.close();
    }
    console.error('Proxy shut down successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error shutting down proxy:', error);
    process.exit(1);
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  shutdown();
});

main();
