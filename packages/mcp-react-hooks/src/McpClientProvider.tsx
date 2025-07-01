import {
  createContext,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { RequestOptions } from '@modelcontextprotocol/sdk/shared/protocol.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type {
  Tool as McpTool,
  Resource,
  ServerCapabilities,
} from '@modelcontextprotocol/sdk/types.js';
import {
  ResourceListChangedNotificationSchema,
  ToolListChangedNotificationSchema,
} from '@modelcontextprotocol/sdk/types.js';

// type ConnectionState = 'disconnected' | 'connecting' | 'initializing' | 'connected' | 'error';

interface McpClientContextValue {
  client: Client;
  tools: McpTool[];
  resources: Resource[];
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  capabilities: ServerCapabilities | null;
  reconnect: () => Promise<void>;
}

const McpClientContext = createContext<McpClientContextValue | null>(null);

export interface McpClientProviderProps {
  children: ReactNode;
  /**
   * Client configuration including name and version.
   */
  client: Client;
  /**
   * Transport instance for the client to connect to.
   */
  transport: Transport;

  /**
   * Options for the client to connect to.
   */
  opts: RequestOptions;
}

/**
 * Provider component that creates and manages an MCP client instance.
 * Handles the connection lifecycle and data fetching automatically.
 *
 * @example
 * ```tsx
 * import { TabClientTransport } from '@mcp-b/transports';
import { RequestOptions } from '@modelcontextprotocol/sdk/shared/protocol.js';
import type { RequestOptions from '@modelcontextprotocol/sdk/shared/protocol.js';
 *
 * const transport = new TabClientTransport('mcp', { clientInstanceId: 'my-app' });
 *
 * function App() {
 *   return (
 *     <McpClientProvider
 *       clientConfig={{ name: 'MyApp', version: '1.0.0' }}
 *       transport={transport}
 *     >
 *       <MyAppContent />
 *     </McpClientProvider>
 *   );
 * }
 * ```
 */
export function McpClientProvider({
  children,
  client,
  transport,
  opts,
}: McpClientProviderProps): ReactElement {
  // State management
  const [resources, setResources] = useState<Resource[]>([]);
  const [tools, setTools] = useState<McpTool[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [capabilities, setCapabilities] = useState<ServerCapabilities | null>(null);

  // Single ref to track connection state
  const connectionStateRef = useRef<'disconnected' | 'connecting' | 'connected'>('disconnected');

  /**
   * Fetches available resources from the MCP server.
   * Only fetches if the server supports resources capability.
   */
  const fetchResourcesInternal = useCallback(async () => {
    if (!client) return;

    const serverCapabilities = client.getServerCapabilities();
    if (!serverCapabilities?.resources) {
      setResources([]);
      return;
    }

    try {
      const response = await client.listResources();
      setResources(response.resources);
    } catch (e) {
      console.error('Error fetching resources:', e);
      throw e;
    }
  }, [client]);

  /**
   * Fetches available tools from the MCP server.
   * Only fetches if the server supports tools capability.
   */
  const fetchToolsInternal = useCallback(async () => {
    if (!client) return;

    const serverCapabilities = client.getServerCapabilities();
    if (!serverCapabilities?.tools) {
      setTools([]);
      return;
    }

    try {
      const response = await client.listTools();
      setTools(response.tools);
    } catch (e) {
      console.error('Error fetching tools:', e);
      throw e;
    }
  }, [client]);

  /**
   * Establishes connection to the MCP server.
   * Safe to call multiple times - will no-op if already connected/connecting.
   */
  const reconnect = useCallback(async () => {
    if (!client || !transport) {
      throw new Error('Client or transport not available');
    }

    // Early return if already connected or connecting
    if (connectionStateRef.current !== 'disconnected') {
      return;
    }

    connectionStateRef.current = 'connecting';
    setIsLoading(true);
    setError(null);

    try {
      // Check if transport is already connected
      const transportAny = transport as any;
      if (transportAny.isConnected) {
        const caps = client.getServerCapabilities();
        setIsConnected(true);
        setCapabilities(caps || null);
        connectionStateRef.current = 'connected';

        // Fetch initial data
        await Promise.all([fetchResourcesInternal(), fetchToolsInternal()]);

        return;
      }

      // Establish new connection
      await client.connect(transport, opts);
      const caps = client.getServerCapabilities();
      setIsConnected(true);
      setCapabilities(caps || null);
      connectionStateRef.current = 'connected';

      // Fetch initial data
      await Promise.all([fetchResourcesInternal(), fetchToolsInternal()]);
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));

      // Handle "already started" error by checking if we're actually connected
      if (err.message.includes('already started')) {
        try {
          const caps = client.getServerCapabilities();
          if (caps) {
            setIsConnected(true);
            setCapabilities(caps);
            connectionStateRef.current = 'connected';

            // Fetch initial data
            await Promise.all([fetchResourcesInternal(), fetchToolsInternal()]);

            return;
          }
        } catch {
          // Not actually connected, reset state
        }
      }

      // Connection failed
      connectionStateRef.current = 'disconnected';
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client, transport, opts, fetchResourcesInternal, fetchToolsInternal]);

  // Set up notification handlers when connected
  useEffect(() => {
    if (!isConnected || !client) {
      return;
    }

    const serverCapabilities = client.getServerCapabilities();

    const handleResourcesChanged = () => {
      fetchResourcesInternal().catch(console.error);
    };

    const handleToolsChanged = () => {
      fetchToolsInternal().catch(console.error);
    };

    if (serverCapabilities?.resources?.listChanged) {
      client.setNotificationHandler(ResourceListChangedNotificationSchema, handleResourcesChanged);
    }

    if (serverCapabilities?.tools?.listChanged) {
      client.setNotificationHandler(ToolListChangedNotificationSchema, handleToolsChanged);
    }

    return () => {
      if (serverCapabilities?.resources?.listChanged) {
        client.removeNotificationHandler('notifications/resources/list_changed');
      }

      if (serverCapabilities?.tools?.listChanged) {
        client.removeNotificationHandler('notifications/tools/list_changed');
      }
    };
  }, [client, isConnected, fetchResourcesInternal, fetchToolsInternal]);

  // Reset connection state if client/transport changes
  useEffect(() => {
    connectionStateRef.current = 'disconnected';
    reconnect();
    setIsConnected(false);
    setCapabilities(null);
    setResources([]);
    setTools([]);
    setError(null);
  }, [client, transport]);
  return (
    <McpClientContext.Provider
      value={{
        client,
        tools,
        resources,
        isConnected,
        isLoading,
        error,
        capabilities,
        reconnect,
      }}
    >
      {children}
    </McpClientContext.Provider>
  );
}

/**
 * Hook to access the MCP client context.
 * Must be used within an McpClientProvider.
 *
 * @returns The MCP client context including client instance, tools, resources, and connection state.
 * @throws Error if used outside of McpClientProvider.
 */
export function useMcpClient() {
  const context = useContext(McpClientContext);
  if (!context) {
    throw new Error('useMcpClient must be used within an McpClientProvider');
  }
  return context;
}
