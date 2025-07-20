import { NativeMessageType } from '@mcp-b/transports';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { stdin, stdout } from 'process';
import { v4 as uuidv4 } from 'uuid';
import { TIMEOUTS } from './constant';
import type { Server } from './server';

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  timeoutId: NodeJS.Timeout;
}

type MessageHandler = (message: unknown) => Promise<void> | void;

export class NativeMessagingHost {
  private associatedServer: Server | null = null;
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private messageHandlers: Map<string, MessageHandler> = new Map();

  constructor() {
    // Initialize default message handlers
    this.messageHandlers.set(NativeMessageType.START, this.handleStart.bind(this));
    this.messageHandlers.set(NativeMessageType.STOP, this.handleStop.bind(this));
    this.messageHandlers.set('ping_from_extension', this.handlePing.bind(this));
    this.messageHandlers.set(
      NativeMessageType.TOOL_LIST_UPDATED,
      this.handleToolListUpdated.bind(this)
    );
  }

  public setServer(serverInstance: Server): void {
    this.associatedServer = serverInstance;
  }

  public start(): void {
    try {
      this.setupMessageHandling();
    } catch (error) {
      process.exit(1);
    }
  }

  private setupMessageHandling(): void {
    let buffer = Buffer.alloc(0);
    let expectedLength = -1;

    stdin.on('readable', () => {
      let chunk: Buffer | null;

      // biome-ignore lint/suspicious/noAssignInExpressions: <temporary>
      while ((chunk = stdin.read()) !== null) {
        buffer = Buffer.concat([buffer, chunk]);

        if (expectedLength === -1 && buffer.length >= 4) {
          expectedLength = buffer.readUInt32LE(0);
          buffer = buffer.slice(4);
        }

        if (expectedLength !== -1 && buffer.length >= expectedLength) {
          const messageBuffer = buffer.slice(0, expectedLength);
          buffer = buffer.slice(expectedLength);

          try {
            const message = JSON.parse(messageBuffer.toString());
            this.handleMessage(message);
          } catch (error) {
            this.sendError(`Failed to parse message: ${(error as Error).message}`);
          }
          expectedLength = -1;
        }
      }
    });

    stdin.on('end', () => {
      this.cleanup();
    });

    stdin.on('error', () => {
      this.cleanup();
    });
  }

  private async handleMessage(message: unknown): Promise<void> {
    if (!message || typeof message !== 'object') {
      this.sendError('Invalid message format');
      return;
    }

    const msg = message as {
      responseToRequestId?: string;
      error?: string;
      payload?: unknown;
      type?: string;
    };

    if (msg.responseToRequestId) {
      const requestId = msg.responseToRequestId;
      const pending = this.pendingRequests.get(requestId);

      if (pending) {
        clearTimeout(pending.timeoutId);
        if (msg.error) {
          pending.reject(new Error(msg.error));
        } else {
          pending.resolve(msg.payload);
        }
        this.pendingRequests.delete(requestId);
      }
      return;
    }

    // Handle directive messages
    try {
      const handler = this.messageHandlers.get(msg.type ?? '');
      if (handler) {
        await handler(message);
      } else if (msg.type) {
        this.sendError(`Unknown message type: ${msg.type}`);
      } else {
        this.sendError('Message type is required');
      }
    } catch (error) {
      this.sendError(`Failed to handle message: ${(error as Error).message}`);
    }
  }

  private async handleStart(message: unknown): Promise<void> {
    const msg = message as { payload?: { port?: number } };
    await this.startServer(msg.payload?.port ?? 3000);
  }

  private async handleStop(): Promise<void> {
    await this.stopServer();
  }

  private handlePing(): void {
    this.sendMessage({ type: 'pong_to_extension' });
  }

  private async handleToolListUpdated(message: unknown): Promise<void> {
    console.log('[NativeMessagingHost] Received TOOL_LIST_UPDATED:', message);
    try {
      const msg = message as { payload?: { tools?: Tool[] } };
      this.sendMessage({
        type: NativeMessageType.TOOL_LIST_UPDATED_ACK,
        payload: { tools: msg.payload?.tools },
      });

      if (this.associatedServer && msg.payload?.tools?.length) {
        const tools = msg.payload.tools as Tool[];
        // tools.forEach((tool) => {
        //   this.associatedServer?.mcpServer?.registerTool(
        //     tool.name,
        //     {
        //       title: tool.name,
        //       description: tool.description,
        //       inputSchema: tool.inputSchema as any,
        //     },
        //     async (request: any) => ({}) as any
        //   );
        // });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[NativeMessagingHost] Failed to update tool list:', error);
      this.sendMessage({
        type: NativeMessageType.ERROR_FROM_NATIVE_HOST,
        payload: {
          message: `Failed to update tool list: ${errorMessage}`,
          error: errorMessage,
          context: 'TOOL_LIST_UPDATED',
        },
      });
    }
  }

  public sendRequestToExtensionAndWait(
    messagePayload: unknown,
    messageType: string = 'request_data',
    timeoutMs: number = TIMEOUTS.DEFAULT_REQUEST_TIMEOUT
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const requestId = uuidv4();

      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pendingRequests.set(requestId, { resolve, reject, timeoutId });

      this.sendMessage({
        type: messageType,
        payload: messagePayload,
        requestId,
      });
    });
  }

  private async startServer(port: number): Promise<void> {
    if (!this.associatedServer) {
      this.sendError('Internal error: server instance not set');
      return;
    }
    if (this.associatedServer.isRunning) {
      this.sendMessage({
        type: NativeMessageType.ERROR,
        payload: { message: 'Server is already running' },
      });
      return;
    }

    await this.associatedServer.start(port, this);

    this.sendMessage({
      type: NativeMessageType.SERVER_STARTED,
      payload: { port },
    });
  }

  private async stopServer(): Promise<void> {
    if (!this.associatedServer) {
      this.sendError('Internal error: server instance not set');
      return;
    }
    if (!this.associatedServer.isRunning) {
      this.sendMessage({
        type: NativeMessageType.ERROR,
        payload: { message: 'Server is not running' },
      });
      return;
    }

    await this.associatedServer.stop();

    this.sendMessage({ type: NativeMessageType.SERVER_STOPPED });
  }

  public sendMessage(message: unknown): void {
    try {
      const messageString = JSON.stringify(message);
      const messageBuffer = Buffer.from(messageString);
      const headerBuffer = Buffer.alloc(4);
      headerBuffer.writeUInt32LE(messageBuffer.length, 0);
      stdout.write(Buffer.concat([headerBuffer, messageBuffer]));
    } catch (error) {
      console.error('[NativeMessagingHost] Failed to send message:', error);
    }
  }

  private sendError(errorMessage: string): void {
    this.sendMessage({
      type: NativeMessageType.ERROR_FROM_NATIVE_HOST,
      payload: { message: errorMessage },
    });
  }

  private cleanup(): void {
    this.pendingRequests.forEach((pending) => {
      clearTimeout(pending.timeoutId);
      pending.reject(new Error('Native host is shutting down or disconnected.'));
    });
    this.pendingRequests.clear();

    if (this.associatedServer?.isRunning) {
      this.associatedServer
        .stop()
        .then(() => {
          process.exit(0);
        })
        .catch(() => {
          process.exit(1);
        });
    } else {
      process.exit(0);
    }
  }

  // Method to add custom message handlers for extensibility
  public addMessageHandler(type: string, handler: MessageHandler): void {
    this.messageHandlers.set(type, handler);
  }
}

const nativeMessagingHostInstance = new NativeMessagingHost();
export default nativeMessagingHostInstance;
