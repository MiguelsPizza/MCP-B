import { randomUUID } from 'node:crypto';
import cors from '@fastify/cors';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  NATIVE_SERVER_PORT,
  SERVER_CONFIG,
  TIMEOUTS,
} from '../constant';
import { getMcpServer } from '../mcp/mcp-server';
import type { NativeMessagingHost } from '../native-messaging-host';

// Define request body type (if data needs to be retrieved from HTTP requests)
interface ExtensionRequestPayload {
  data?: any; // Data you want to pass to the extension
}

export class Server {
  public fastify: FastifyInstance;
  public isRunning = false; // Changed to public or provide a getter
  public nativeHost: NativeMessagingHost | null = null;
  public mcpServer: McpServer | null = null;
  public transportsMap: Map<string, StreamableHTTPServerTransport | SSEServerTransport> = new Map();

  constructor() {
    this.fastify = Fastify({ logger: SERVER_CONFIG.LOGGER_ENABLED });
    this.setupPlugins();
    this.setupRoutes();
  }
  /**
   * Associate NativeMessagingHost instance
   */
  public setNativeHost(nativeHost: NativeMessagingHost): void {
    this.nativeHost = nativeHost;
  }

  private async setupPlugins(): Promise<void> {
    await this.fastify.register(cors, {
      origin: SERVER_CONFIG.CORS_ORIGIN,
    });
  }

  private setupRoutes(): void {
    // for ping
    this.fastify.get(
      '/ask-extension',
      async (request: FastifyRequest<{ Body: ExtensionRequestPayload }>, reply: FastifyReply) => {
        if (!this.nativeHost) {
          return reply
            .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
            .send({ error: ERROR_MESSAGES.NATIVE_HOST_NOT_AVAILABLE });
        }
        if (!this.isRunning) {
          return reply
            .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
            .send({ error: ERROR_MESSAGES.SERVER_NOT_RUNNING });
        }

        try {
          // wait from extension message
          const extensionResponse = await this.nativeHost.sendRequestToExtensionAndWait(
            request.query,
            'process_data',
            TIMEOUTS.EXTENSION_REQUEST_TIMEOUT
          );
          return reply.status(HTTP_STATUS.OK).send({ status: 'success', data: extensionResponse });
        } catch (error: any) {
          if (error.message.includes('timed out')) {
            return reply
              .status(HTTP_STATUS.GATEWAY_TIMEOUT)
              .send({ status: 'error', message: ERROR_MESSAGES.REQUEST_TIMEOUT });
          } else {
            return reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
              status: 'error',
              message: `Failed to get response from extension: ${error.message}`,
            });
          }
        }
      }
    );

    // Compatible with SSE
    this.fastify.get('/sse', async (_, reply) => {
      try {
        // Set SSE headers
        reply.raw.writeHead(HTTP_STATUS.OK, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        });

        // Create SSE transport
        const transport = new SSEServerTransport('/messages', reply.raw);
        this.transportsMap.set(transport.sessionId, transport);

        reply.raw.on('close', () => {
          this.transportsMap.delete(transport.sessionId);
        });

        const server = getMcpServer();
        await server.connect(transport);

        // Keep connection open
        reply.raw.write(':\n\n');
      } catch (error) {
        if (!reply.sent) {
          reply.code(HTTP_STATUS.INTERNAL_SERVER_ERROR).send(ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
        }
      }
    });

    // Compatible with SSE
    this.fastify.post('/messages', async (req, reply) => {
      try {
        const { sessionId } = req.query as any;
        const transport = this.transportsMap.get(sessionId) as SSEServerTransport;
        if (!sessionId || !transport) {
          reply.code(HTTP_STATUS.BAD_REQUEST).send('No transport found for sessionId');
          return;
        }

        await transport.handlePostMessage(req.raw, reply.raw, req.body);
      } catch (error) {
        if (!reply.sent) {
          reply.code(HTTP_STATUS.INTERNAL_SERVER_ERROR).send(ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
        }
      }
    });

    // POST /mcp: Handle client-to-server messages
    this.fastify.post('/mcp', async (request, reply) => {
      const sessionId = request.headers['mcp-session-id'] as string | undefined;
      let transport: StreamableHTTPServerTransport | undefined = this.transportsMap.get(
        sessionId || ''
      ) as StreamableHTTPServerTransport;
      if (transport) {
        // transport found, do nothing
      } else if (!sessionId && isInitializeRequest(request.body)) {
        const newSessionId = randomUUID(); // Generate session ID
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => newSessionId, // Use pre-generated ID
          onsessioninitialized: (initializedSessionId) => {
            // Ensure transport instance exists and session ID matches
            if (transport && initializedSessionId === newSessionId) {
              this.transportsMap.set(initializedSessionId, transport);
            }
          },
        });

        transport.onclose = () => {
          if (transport?.sessionId && this.transportsMap.get(transport.sessionId)) {
            this.transportsMap.delete(transport.sessionId);
          }
        };
        const mcpServer = getMcpServer();
        await mcpServer.connect(transport);
        this.mcpServer = mcpServer;
      } else {
        reply.code(HTTP_STATUS.BAD_REQUEST).send({ error: ERROR_MESSAGES.INVALID_MCP_REQUEST });
        return;
      }

      try {
        await transport.handleRequest(request.raw, reply.raw, request.body);
      } catch (error) {
        if (!reply.sent) {
          reply
            .code(HTTP_STATUS.INTERNAL_SERVER_ERROR)
            .send({ error: ERROR_MESSAGES.MCP_REQUEST_PROCESSING_ERROR });
        }
      }
    });

    this.fastify.get('/mcp', async (request, reply) => {
      const sessionId = request.headers['mcp-session-id'] as string | undefined;
      const transport = sessionId
        ? (this.transportsMap.get(sessionId) as StreamableHTTPServerTransport)
        : undefined;
      if (!transport) {
        reply.code(HTTP_STATUS.BAD_REQUEST).send({ error: ERROR_MESSAGES.INVALID_SSE_SESSION });
        return;
      }

      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Cache-Control', 'no-cache');
      reply.raw.setHeader('Connection', 'keep-alive');
      reply.raw.flushHeaders(); // Ensure headers are sent immediately

      try {
        // transport.handleRequest will take over the response stream
        await transport.handleRequest(request.raw, reply.raw);
        if (!reply.sent) {
          // If transport didn't send anything (unlikely for SSE initial handshake)
          reply.hijack(); // Prevent Fastify from automatically sending response
        }
      } catch (error) {
        if (!reply.raw.writableEnded) {
          reply.raw.end();
        }
      }

      request.socket.on('close', () => {
        request.log.info(`SSE client disconnected for session: ${sessionId}`);
        // transport's onclose should handle its own cleanup
      });
    });

    this.fastify.delete('/mcp', async (request, reply) => {
      const sessionId = request.headers['mcp-session-id'] as string | undefined;
      const transport = sessionId
        ? (this.transportsMap.get(sessionId) as StreamableHTTPServerTransport)
        : undefined;

      if (!transport) {
        reply.code(HTTP_STATUS.BAD_REQUEST).send({ error: ERROR_MESSAGES.INVALID_SESSION_ID });
        return;
      }

      try {
        await transport.handleRequest(request.raw, reply.raw);
        // Assume transport.handleRequest will send response or transport.onclose will cleanup
        if (!reply.sent) {
          reply.code(HTTP_STATUS.NO_CONTENT).send();
        }
      } catch (error) {
        if (!reply.sent) {
          reply
            .code(HTTP_STATUS.INTERNAL_SERVER_ERROR)
            .send({ error: ERROR_MESSAGES.MCP_SESSION_DELETION_ERROR });
        }
      }
    });
  }

  public async start(port = NATIVE_SERVER_PORT, nativeHost: NativeMessagingHost): Promise<void> {
    if (!this.nativeHost) {
      this.nativeHost = nativeHost; // Ensure nativeHost is set
    } else if (this.nativeHost !== nativeHost) {
      this.nativeHost = nativeHost; // Update to the passed instance
    }

    if (this.isRunning) {
      return;
    }

    try {
      await this.fastify.listen({ port, host: SERVER_CONFIG.HOST });
      this.isRunning = true; // Update running status
      // No need to return, Promise resolves void by default
    } catch (err) {
      this.isRunning = false; // Startup failed, reset status
      // Throw error instead of exiting directly, let caller (possibly NativeHost) handle
      throw err; // or return Promise.reject(err);
      // process.exit(1); // Not recommended to exit directly here
    }
  }

  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }
    // this.nativeHost = null; // Not recommended to nullify here, association relationship may still be needed
    try {
      await this.fastify.close();
      this.isRunning = false; // Update running status
    } catch (err) {
      // Even if closing fails, mark as not running, but log the error
      this.isRunning = false;
      throw err; // Throw error
    }
  }

  public getInstance(): FastifyInstance {
    return this.fastify;
  }
}

const serverInstance = new Server();
export default serverInstance;
