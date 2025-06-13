import { useCallback, useEffect, useRef, useState } from 'react';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { RequestOptions } from '@modelcontextprotocol/sdk/shared/protocol.js';
import type {
  Tool as McpTool,
  Resource,
  ServerCapabilities,
} from '@modelcontextprotocol/sdk/types.js';
import {
  ResourceListChangedNotificationSchema,
  ToolListChangedNotificationSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { useMcpContext } from './McpContext';

/**
 * Result object returned by the useMcpClient hook.
 */
export interface UseMcpClientResult {
  /** The MCP client instance for making direct calls */
  client: Client;
  /** Array of available resources from the MCP server */
  resources: Resource[];
  /** Array of available tools from the MCP server */
  tools: McpTool[];
  /** Whether the hook is currently loading (connecting or fetching initial data) */
  isLoading: boolean;
  /** Any error that occurred during connection or data fetching */
  error: Error | null;
  /** Function to manually trigger connection */
  connect: () => Promise<void>;
  /** Whether the client is currently connected to the MCP server */
  isConnected: boolean;
  /** The server capabilities, available after successful connection */
  capabilities: ServerCapabilities | null;
}

/**
 * A React hook for managing MCP client connections and data.
 *
 * This hook handles:
 * - Manual connection to the MCP server via connect()
 * - Fetching and caching of resources and tools
 * - Real-time updates via server notifications
 * - Connection state management
 * - Error handling and cleanup
 *
 * Must be used within an McpProvider context.
 *
 * @param opts - Optional request options to pass to the client connection
 * @returns An object containing the client, data, and connection state
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { client, resources, tools, isLoading, error, isConnected, connect } = useMcpClient();
 *
 *   useEffect(() => {
 *     connect().catch(console.error);
 *   }, [connect]);
 *
 *   if (isLoading) return <div>Connecting...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!isConnected) return <div>Not connected</div>;
 *
 *   return (
 *     <div>
 *       <h2>Tools: {tools.length}</h2>
 *       <h2>Resources: {resources.length}</h2>
 *     </div>
 *   );
 * }
 * ```
 */
export function useMcpClient(opts?: RequestOptions): UseMcpClientResult {
  const { client, transport } = useMcpContext();

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
  const connect = useCallback(async () => {
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
    setIsConnected(false);
    setCapabilities(null);
    setResources([]);
    setTools([]);
    setError(null);
  }, [client, transport]);

  return {
    client,
    resources,
    tools,
    isLoading,
    error,
    connect,
    isConnected,
    capabilities,
  };
}
