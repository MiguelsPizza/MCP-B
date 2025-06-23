import { createServer } from 'http';
import { WebSocketServer } from 'ws';

interface BridgeConnection {
  id: string;
  clientWs: any; // WebSocket from MCP client
  extensionWs?: any; // WebSocket from browser extension
  messageQueue: any[]; // Queue messages when no extension available
}

export class McpWebSocketBridge {
  private wss: WebSocketServer;
  private server: any;
  private connections = new Map<string, BridgeConnection>();
  private extensionConnections = new Set<any>();
  private isShuttingDown = false;
  private pendingConnections = new Set<BridgeConnection>(); // Connections waiting for extension

  constructor(port: number = 3000) {
    this.server = createServer();
    this.wss = new WebSocketServer({ server: this.server });

    this.wss.on('connection', (ws, req) => {
      const url = new URL(req.url!, `http://localhost:${port}`);
      const isExtension = url.searchParams.get('type') === 'extension';

      if (isExtension) {
        this.handleExtensionConnection(ws);
      } else {
        this.handleClientConnection(ws);
      }
    });

    // Handle port in use error
    this.server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Please choose a different port.`);
        console.error('You can use the --port option to specify a different port.');
        process.exit(1);
      } else {
        console.error('Server error:', error);
        process.exit(1);
      }
    });

    this.server.listen(port, () => {
      console.log(`MCP WebSocket Bridge listening on port ${port}`);
    });
  }

  async shutdown(): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    console.log('Closing all WebSocket connections...');

    // Close all client connections
    for (const [id, connection] of this.connections) {
      if (connection.clientWs.readyState === 1) {
        // OPEN
        connection.clientWs.close(1000, 'Server shutting down');
      }
    }

    // Close all extension connections
    for (const ws of this.extensionConnections) {
      if (ws.readyState === 1) {
        // OPEN
        ws.close(1000, 'Server shutting down');
      }
    }

    // Close the WebSocket server
    await new Promise<void>((resolve) => {
      this.wss.close(() => {
        console.log('WebSocket server closed');
        resolve();
      });
    });

    // Close the HTTP server
    await new Promise<void>((resolve) => {
      this.server.close(() => {
        console.log('HTTP server closed');
        resolve();
      });
    });
  }

  private handleExtensionConnection(ws: any) {
    console.log('Extension connected to bridge');
    this.extensionConnections.add(ws);

    // Process any pending connections that were waiting for an extension
    for (const connection of this.pendingConnections) {
      connection.extensionWs = ws;
      this.pendingConnections.delete(connection);

      console.log(`Assigned extension to pending connection ${connection.id}`);

      // Send any queued messages
      while (connection.messageQueue.length > 0) {
        const message = connection.messageQueue.shift();
        const forwardMessage = {
          ...message,
          connectionId: connection.id,
        };
        console.log(`📤 Sending queued message to extension for ${connection.id}`);
        ws.send(JSON.stringify(forwardMessage));
      }
    }

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());

        // Route message from extension to the appropriate client
        if (message.connectionId) {
          const connection = this.connections.get(message.connectionId);
          if (connection?.clientWs.readyState === 1) {
            // OPEN
            // Remove connectionId before forwarding
            const { connectionId, ...forwardMessage } = message;
            console.log('↩️ Extension → Client:', JSON.stringify(forwardMessage, null, 2));
            connection.clientWs.send(JSON.stringify(forwardMessage));
          }
        }
      } catch (error) {
        console.error('Error handling extension message:', error);
      }
    });

    ws.on('close', () => {
      console.log('Extension disconnected from bridge');
      this.extensionConnections.delete(ws);

      // Mark all connections using this extension as needing a new one
      for (const connection of this.connections.values()) {
        if (connection.extensionWs === ws) {
          connection.extensionWs = undefined;
          // Try to find another available extension
          const newExtension = this.getAvailableExtension();
          if (newExtension) {
            connection.extensionWs = newExtension;
            console.log(`Reassigned connection ${connection.id} to another extension`);
          } else {
            // No extension available, add to pending
            this.pendingConnections.add(connection);
            console.log(`Connection ${connection.id} is now pending an extension`);
          }
        }
      }
    });

    ws.on('error', (error: Error) => {
      console.error('Extension WebSocket error:', error);
    });
  }

  private handleClientConnection(ws: any) {
    const connectionId = this.generateConnectionId();
    console.log(`MCP client connected: ${connectionId}`);

    const connection: BridgeConnection = {
      id: connectionId,
      clientWs: ws,
      messageQueue: [],
    };

    this.connections.set(connectionId, connection);

    // Find an available extension connection
    const extensionWs = this.getAvailableExtension();
    if (extensionWs) {
      connection.extensionWs = extensionWs;
      console.log(`Assigned extension to connection ${connectionId}`);
    } else {
      // No extension available yet, add to pending
      this.pendingConnections.add(connection);
      console.log(`No extension available for ${connectionId}, connection is pending`);
    }

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());

        console.log('↗️ Client → Extension:', JSON.stringify(message, null, 2));

        // Enhanced logging for tool calls
        if (message.method === 'tools/call') {
          console.log('🔧 Tool call in bridge:');
          console.log(`  Method: ${message.method}`);
          console.log(`  Params: ${JSON.stringify(message.params, null, 2)}`);
          if (message.params?.arguments) {
            console.log(`  Arguments: ${JSON.stringify(message.params.arguments, null, 2)}`);
          }
        }

        // Forward to extension with connectionId
        if (connection.extensionWs?.readyState === 1) {
          // OPEN
          const forwardMessage = {
            ...message,
            connectionId,
          };
          console.log('📤 Forwarding to extension with connectionId:', connectionId);
          connection.extensionWs.send(JSON.stringify(forwardMessage));
        } else {
          console.warn(`No extension available for connection ${connectionId}, queueing message`);
          // Queue the message for when an extension becomes available
          connection.messageQueue.push(message);

          // Try to find an extension again
          const newExtension = this.getAvailableExtension();
          if (newExtension) {
            connection.extensionWs = newExtension;
            this.pendingConnections.delete(connection);

            // Send queued messages
            while (connection.messageQueue.length > 0) {
              const queuedMessage = connection.messageQueue.shift();
              const forwardMessage = {
                ...queuedMessage,
                connectionId,
              };
              newExtension.send(JSON.stringify(forwardMessage));
            }
          }
        }
      } catch (error) {
        console.error('Error handling client message:', error);
      }
    });

    ws.on('close', () => {
      console.log(`MCP client disconnected: ${connectionId}`);
      this.connections.delete(connectionId);
      this.pendingConnections.delete(connection);
    });

    ws.on('error', (error: Error) => {
      console.error(`Client ${connectionId} WebSocket error:`, error);
    });
  }

  private getAvailableExtension(): any {
    // For now, just return the first connected extension
    // Could implement load balancing or other strategies
    return this.extensionConnections.values().next().value;
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
