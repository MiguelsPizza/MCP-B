import type { McpServer, RegisteredTool } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { RequestOptions } from '@modelcontextprotocol/sdk/shared/protocol.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type { ElicitRequest, ElicitResult } from '@modelcontextprotocol/sdk/types.js';
import {
  createContext,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

interface McpServerContextValue {
  server: McpServer;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  /**
   * Elicit input from the user through the client.
   * This is useful for interactive workqlows where the server needs user input or confirmation.
   *
   * @param message The message to display to the user
   * @param requestedSchema JSON Schema for the expected response
   * @param options Optional request options like timeout
   * @returns The user's response with action and optional content
   */
  elicitInput: (
    message: string,
    requestedSchema: ElicitRequest['params']['requestedSchema'],
    options?: RequestOptions
  ) => Promise<ElicitResult>;
  /**
   * Register a tool with the server. Returns a function to unregister the tool.
   * This is a convenience wrapper around server.registerTool() that provides better React integration.
   *
   * @param name Tool name
   * @param config Tool configuration including description, input/output schemas, and annotations
   * @param callback Tool implementation
   * @returns Function to unregister the tool
   */
  registerTool: McpServer['registerTool'];
}

const McpServerContext = createContext<McpServerContextValue | null>(null);

export interface McpServerProviderProps {
  children: ReactNode;
  /**
   * Server instance to use.
   */
  server: McpServer;

  /**
   * Transport instance for the server to connect to.
   */
  transport: Transport;
}

/**
 * Provider component that creates and manages an MCP server instance.
 * Handles the connection lifecycle automatically.
 *
 * @example
 * ```tsx
 * import { TabServerTransport } from '@mcp-b/transports';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
 *
 * const transport = new TabServerTransport();
 *
 * function App() {
 *   return (
 *     <McpServerProvider
 *       transport={transport}
 *       server={server}
 *     >
 *       <MyServerUI />
 *     </McpServerProvider>
 *   );
 * }
 * ```
 */
export function McpServerProvider({
  children,
  transport,
  server,
}: McpServerProviderProps): ReactElement {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [registeredTools, setRegisteredTools] = useState<Set<RegisteredTool>>(new Set());

  useEffect(() => {
    let mounted = true;

    const connectServer = async () => {
      try {
        setIsConnecting(true);
        await server.connect(transport);
        if (mounted) {
          setIsConnected(true);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          const error = err instanceof Error ? err : new Error(String(err));
          // Handle "already started" error
          if (error.message.includes('already started')) {
            setIsConnected(true);
            setError(null);
          } else {
            setError(error);
            setIsConnected(false);
          }
        }
      } finally {
        setIsConnecting(false);
      }
    };

    connectServer();

    return () => {
      mounted = false;
      registeredTools.forEach((tool) => tool.remove());
    };
  }, [server, transport]);

  // Elicit input from the user through the client
  const elicitInput = useCallback(
    async (
      message: string,
      requestedSchema: ElicitRequest['params']['requestedSchema'],
      options?: RequestOptions
    ): Promise<ElicitResult> => {
      if (!isConnected) {
        throw new Error('Server not connected. Cannot elicit input.');
      }

      return server.server.elicitInput(
        {
          message,
          requestedSchema,
        },
        options
      );
    },
    [server, isConnected]
  );

  // Register a tool with automatic cleanup support
  const registerTool = useCallback<McpServer['registerTool']>(
    (name, config, callback) => {
      if (!isConnected) {
        console.warn(
          'Server not connected. Tool will be registered when connection is established.'
        );
      }

      const registeredTool = server.registerTool(name, config, callback);
      setRegisteredTools((prev) => prev.add(registeredTool));
      return registeredTool;
    },
    [server, isConnected]
  );

  return (
    <McpServerContext.Provider
      value={{ server, isConnected, isConnecting, error, elicitInput, registerTool }}
    >
      {children}
    </McpServerContext.Provider>
  );
}

/**
 * Hook to access the MCP server context.
 * Must be used within an McpServerProvider.
 *
 * @returns The MCP server context including server instance and connection state.
 * @throws Error if used outside of McpServerProvider.
 */
export function useMcpServer() {
  const context = useContext(McpServerContext);
  if (!context) {
    throw new Error('useMcpServer must be used within an McpServerProvider');
  }
  return context;
}
