import { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { Transport, TransportSendOptions } from '@modelcontextprotocol/sdk/shared/transport.js';
import {
  isInitializeRequest,
  isJSONRPCError,
  isJSONRPCResponse,
  JSONRPCMessage,
  JSONRPCMessageSchema,
  RequestId,
} from '@modelcontextprotocol/sdk/types.js';
import {
  EventId,
  MCPBrowserInterface,
  MCPConnectOptions,
  MCPEventMessage,
  MCPReplayEventMessage,
  MCPServerInfo,
  MCPServerInfoMessage,
  MCPWindow,
  StoredEvent,
  StreamId,
} from '../browser-types.js';

/**
 * In-memory event store implementation
 */
class InMemoryEventStore {
  private _events: StoredEvent[] = [];
  private _eventCounter: number = 0;
  private _maxEventsPerClient: number;

  constructor(maxEventsPerClient: number = 1000) {
    this._maxEventsPerClient = maxEventsPerClient;
  }

  async storeEvent(
    streamId: StreamId,
    clientId: string,
    message: JSONRPCMessage
  ): Promise<EventId> {
    const eventId = `evt_${++this._eventCounter}_${Date.now()}`;
    const event: StoredEvent = {
      eventId,
      streamId,
      message,
      timestamp: Date.now(),
      clientId,
    };

    this._events.push(event);

    // Cleanup old events for this client if limit exceeded
    const clientEvents = this._events.filter((e) => e.clientId === clientId);
    if (clientEvents.length > this._maxEventsPerClient) {
      const eventsToRemove = clientEvents.slice(0, clientEvents.length - this._maxEventsPerClient);
      this._events = this._events.filter((e) => !eventsToRemove.includes(e));
    }

    return eventId;
  }

  async replayEventsAfter(
    clientId: string,
    lastEventId: EventId | undefined,
    send: (eventId: EventId, message: JSONRPCMessage) => Promise<void>
  ): Promise<StreamId> {
    const clientEvents = this._events.filter((e) => e.clientId === clientId);

    let startIndex = 0;
    if (lastEventId) {
      const lastEventIndex = clientEvents.findIndex((e) => e.eventId === lastEventId);
      if (lastEventIndex >= 0) {
        startIndex = lastEventIndex + 1;
      }
    }

    const eventsToReplay = clientEvents.slice(startIndex);
    for (const event of eventsToReplay) {
      await send(event.eventId, event.message);
    }

    // Return the stream ID from the last replayed event, or generate new one
    return eventsToReplay.length > 0
      ? eventsToReplay[eventsToReplay.length - 1].streamId
      : `stream_${Date.now()}`;
  }

  getEvents(clientId?: string, afterEventId?: EventId, limit: number = 100): StoredEvent[] {
    let events = clientId ? this._events.filter((e) => e.clientId === clientId) : this._events;

    if (afterEventId) {
      const afterIndex = events.findIndex((e) => e.eventId === afterEventId);
      if (afterIndex >= 0) {
        events = events.slice(afterIndex + 1);
      }
    }

    return events.slice(0, limit);
  }

  getLastEventId(clientId?: string): EventId | null {
    const events = clientId ? this._events.filter((e) => e.clientId === clientId) : this._events;

    return events.length > 0 ? events[events.length - 1].eventId : null;
  }

  clearEvents(clientId?: string): void {
    if (clientId) {
      this._events = this._events.filter((e) => e.clientId !== clientId);
    } else {
      this._events = [];
    }
  }

  removeClientEvents(clientId: string): void {
    this._events = this._events.filter((e) => e.clientId !== clientId);
  }
}

/**
 * Configuration options for BrowserServerTransport
 */
export interface BrowserServerTransportOptions {
  /**
   * Function that generates a session ID for each client connection.
   * Return undefined to operate in stateless mode.
   * If not provided, defaults to undefined (stateless mode).
   */
  sessionIdGenerator?: (() => string) | undefined;

  /**
   * Callback for session initialization events
   */
  onsessioninitialized?: (clientSessionId: string | undefined, clientInstanceId: string) => void;

  /**
   * Optional namespace to use instead of window.mcp
   */
  globalNamespace?: string;

  /**
   * Enable event storage for resumability (only works in stateful mode)
   * Default is true in stateful mode, false in stateless mode
   */
  enableEventStore?: boolean;

  /**
   * Maximum number of events to store per client (default: 1000)
   */
  maxEventsPerClient?: number;
}

interface ClientConnection {
  port: MessagePort;
  clientInstanceId: string;
  serverSessionId?: string;
  streamId: StreamId;
  initialized: boolean;
  requestIds: Set<RequestId>;
}

/**
 * Server transport for browser environments using window.mcp global
 * Supports multiple concurrent client connections via MessageChannel
 */
export class TabServerTransport implements Transport {
  private _serverInstanceId: string;
  private _sessionIdGenerator: (() => string) | undefined;
  private _onsessioninitialized?: (
    clientSessionId: string | undefined,
    clientInstanceId: string
  ) => void;

  private _isStarted: boolean = false;
  private _clients: Map<string, ClientConnection> = new Map();
  private _globalNamespace: string;
  private _eventStore?: InMemoryEventStore;
  private _enableEventStore: boolean;

  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage, extra?: { authInfo?: AuthInfo | undefined }) => void;

  constructor(options?: BrowserServerTransportOptions) {
    this._sessionIdGenerator = options?.sessionIdGenerator;
    this._onsessioninitialized = options?.onsessioninitialized;
    this._globalNamespace = options?.globalNamespace || 'mcp';

    // Event store is enabled by default in stateful mode
    this._enableEventStore = options?.enableEventStore ?? this._sessionIdGenerator !== undefined;

    if (this._enableEventStore && this._sessionIdGenerator) {
      this._eventStore = new InMemoryEventStore(options?.maxEventsPerClient);
    }

    this._serverInstanceId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `server-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async start(): Promise<void> {
    if (this._isStarted) {
      throw new Error('BrowserServerTransport already started');
    }

    // Check if another server is already registered
    const windowWithMcp = window as MCPWindow;
    const existingMcp =
      this._globalNamespace === 'mcp'
        ? windowWithMcp.mcp
        : (windowWithMcp as any)[this._globalNamespace];
    if (existingMcp?.isServerAvailable?.()) {
      throw new Error(
        `Another MCP server is already registered at window.${this._globalNamespace}`
      );
    }

    const mcpInterface: MCPBrowserInterface = {
      connect: (clientId: string, options?: MCPConnectOptions): MessagePort | null => {
        if (!this._isStarted) {
          console.error('MCP server not started');
          return null;
        }

        if (this._clients.has(clientId)) {
          console.error(`Client ${clientId} already connected`);
          return null;
        }

        const channel = new MessageChannel();
        const serverPort = channel.port1;
        const clientPort = channel.port2;

        const serverSessionId = this._sessionIdGenerator?.();
        const streamId = `stream_${clientId}_${Date.now()}`;

        const connection: ClientConnection = {
          port: serverPort,
          clientInstanceId: clientId,
          serverSessionId,
          streamId,
          initialized: false,
          requestIds: new Set(),
        };

        this._setupClientConnection(connection, options?.resumeFrom);
        this._clients.set(clientId, connection);

        return clientPort;
      },

      disconnect: (clientId: string): void => {
        const client = this._clients.get(clientId);
        if (client) {
          client.port.close();
          this._clients.delete(clientId);
          // Note: We keep events for disconnected clients for resumability
        }
      },

      isServerAvailable: (): boolean => {
        return this._isStarted;
      },

      getServerInfo: (): MCPServerInfo => ({
        instanceId: this._serverInstanceId,
        stateful: this._sessionIdGenerator !== undefined,
        hasEventStore: this._eventStore !== undefined,
      }),

      terminateSession: (clientId: string): void => {
        const client = this._clients.get(clientId);
        if (client) {
          client.port.close();
          this._clients.delete(clientId);
        }
        this._eventStore?.removeClientEvents(clientId);
      },
    };

    // Add event storage interface if enabled
    if (this._eventStore) {
      mcpInterface.events = {
        getEvents: (clientId?: string, afterEventId?: EventId, limit?: number) => {
          return this._eventStore!.getEvents(clientId, afterEventId, limit);
        },
        getLastEventId: (clientId?: string) => {
          return this._eventStore!.getLastEventId(clientId);
        },
        clearEvents: (clientId?: string) => {
          this._eventStore!.clearEvents(clientId);
        },
      };
    }

    if (this._globalNamespace === 'mcp') {
      (window as MCPWindow).mcp = mcpInterface;
    } else {
      (window as any)[this._globalNamespace] = mcpInterface;
    }
    this._isStarted = true;
  }

  private async _setupClientConnection(
    connection: ClientConnection,
    resumeFromEventId?: EventId
  ): Promise<void> {
    const { port, clientInstanceId } = connection;

    port.onmessage = (event: MessageEvent) => {
      try {
        const message = JSONRPCMessageSchema.parse(event.data);

        // Track request IDs from this client
        if ('id' in message && message.id !== undefined && 'method' in message) {
          connection.requestIds.add(message.id);
        }

        const isInitReq = isInitializeRequest(message);

        if (isInitReq) {
          if (connection.initialized) {
            this.onerror?.(new Error(`Client ${clientInstanceId} attempted to re-initialize`));
            return;
          }
          connection.initialized = true;
          this._onsessioninitialized?.(connection.serverSessionId, clientInstanceId);
        } else if (!connection.initialized) {
          const errMsg = `Client ${clientInstanceId} sent message before initialization`;
          this.onerror?.(new Error(errMsg));
          return;
        }

        this.onmessage?.(message, {
          authInfo: {
            clientId: clientInstanceId,
            token: 'N/A',
            scopes: ['browser'],
          },
        });
      } catch (error) {
        this.onerror?.(error instanceof Error ? error : new Error(String(error)));
      }
    };

    port.onmessageerror = () => {
      this.onerror?.(new Error(`MessagePort error for client ${clientInstanceId}`));
    };

    port.start();

    // Send initial server info
    const serverInfoMessage: MCPServerInfoMessage = {
      type: 'mcp-server-info',
      serverInstanceId: this._serverInstanceId,
      serverSessionId: connection.serverSessionId,
      hasEventStore: this._eventStore !== undefined,
      streamId: connection.streamId,
    };
    port.postMessage(serverInfoMessage);

    // Replay events if resuming
    if (resumeFromEventId && this._eventStore) {
      await this._eventStore.replayEventsAfter(
        clientInstanceId,
        resumeFromEventId,
        async (eventId: EventId, message: JSONRPCMessage) => {
          const replayMessage: MCPReplayEventMessage = {
            type: 'mcp-replay-event',
            eventId,
            message,
          };
          port.postMessage(replayMessage);
        }
      );
    }
  }

  async send(
    message: JSONRPCMessage,
    options?: TransportSendOptions & { targetClientId?: string }
  ): Promise<void> {
    if (!this._isStarted) {
      throw new Error('BrowserServerTransport not started');
    }

    let targetConnections: ClientConnection[] = [];

    // Determine target client(s)
    if (options?.relatedRequestId) {
      // Find client that made this request
      for (const [_, connection] of this._clients) {
        if (connection.requestIds.has(options.relatedRequestId)) {
          targetConnections = [connection];
          // Clean up request ID if this is a response
          if (isJSONRPCResponse(message) || isJSONRPCError(message)) {
            connection.requestIds.delete(options.relatedRequestId);
          }
          break;
        }
      }
    } else if (options?.targetClientId) {
      const connection = this._clients.get(options.targetClientId);
      if (connection) {
        targetConnections = [connection];
      }
    } else {
      // Broadcast to all initialized clients
      targetConnections = Array.from(this._clients.values()).filter((c) => c.initialized);
    }

    if (targetConnections.length === 0) {
      this.onerror?.(new Error('No suitable clients found for message'));
      return;
    }

    for (const connection of targetConnections) {
      // Store event if event store is enabled
      let eventId: EventId | undefined;
      if (this._eventStore) {
        eventId = await this._eventStore.storeEvent(
          connection.streamId,
          connection.clientInstanceId,
          message
        );
      }

      // Send message with event ID if available
      if (eventId) {
        const eventMessage: MCPEventMessage = {
          type: 'mcp-event',
          eventId,
          message,
        };
        connection.port.postMessage(eventMessage);
      } else {
        connection.port.postMessage(message);
      }
    }
  }

  async close(): Promise<void> {
    if (!this._isStarted) {
      return;
    }

    // Close all client connections
    for (const connection of this._clients.values()) {
      connection.port.close();
    }
    this._clients.clear();

    // Clear all events
    this._eventStore?.clearEvents();

    // Remove global interface
    if (this._globalNamespace === 'mcp') {
      delete (window as MCPWindow).mcp;
    } else {
      delete (window as any)[this._globalNamespace];
    }

    this._isStarted = false;
    this.onclose?.();
  }

  get clientCount(): number {
    return this._clients.size;
  }

  get clients(): ReadonlyArray<{
    clientId: string;
    initialized: boolean;
    serverSessionId?: string;
  }> {
    return Array.from(this._clients.entries()).map(([clientId, connection]) => ({
      clientId,
      initialized: connection.initialized,
      serverSessionId: connection.serverSessionId,
    }));
  }
}
