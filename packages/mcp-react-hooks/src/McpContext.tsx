import { createContext, type ReactElement, type ReactNode, useContext } from 'react';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';

interface McpContextValue {
  transport: Transport;
  client: InstanceType<typeof Client>;
}

const McpContext = createContext<McpContextValue | null>(null);

/**
 * Check if we're running in a browser environment with MCP server available
 */
function isBrowserMcpEnvironment(globalNamespace: string = 'mcp'): boolean {
  try {
    if (typeof window === 'undefined') return false;

    const windowWithMcp = window as any;
    const mcp = globalNamespace === 'mcp' ? windowWithMcp.mcp : windowWithMcp[globalNamespace];

    return !!mcp?.isServerAvailable?.();
  } catch {
    return false;
  }
}

export interface McpProviderProps {
  children: ReactNode;
  /** A pre-configured, connected MCP transport instance. */
  transport: Transport;
  /** A pre-configured, connected MCP client instance. */
  client: InstanceType<typeof Client>;
}

/**
 * Provider component that shares a single MCP Transport and Client instance
 * across all child components. This ensures all MCP operations use the same
 * connection.
 *
 * The transport and client should be created and connected outside of this provider.
 *
 * @example
 * ```tsx
 * // For in-page apps
 * const transport = new TabClientTransport('mcp', { clientInstanceId: 'my-app' });
 * const client = new Client({ name: 'MyApp', version: '1.0.0' });
 * await client.connect(transport);
 *
 * function App() {
 *   return (
 *     <McpProvider transport={transport} mcpClient={client}>
 *       <MyAppContent />
 *     </McpProvider>
 *   );
 * }
 * ```
 */
export function McpProvider({ children, transport, client }: McpProviderProps): ReactElement {
  const contextValue: McpContextValue = {
    transport,
    client,
  };

  return <McpContext.Provider value={contextValue}>{children}</McpContext.Provider>;
}

/**
 * Hook to access the shared MCP context, including the transport and client.
 * Must be used within an McpProvider.
 *
 * @returns The shared McpContextValue
 * @throws Error if used outside of McpProvider
 */
export function useMcpContext(): McpContextValue {
  const context = useContext(McpContext);
  if (!context) {
    throw new Error('useMcpContext must be used within a McpProvider');
  }
  return context;
}

/**
 * @deprecated Use useMcpContext() instead to get access to the client and transport.
 */
export function useBrowserTransport(): Transport {
  const context = useMcpContext();
  return context.transport;
}

/**
 * @example
 * ```tsx
 * function AppWithConditionalMcp() {
 *   const mcpAvailable = checkBrowserMcpAvailability('mcp');
 *
 *   if (!mcpAvailable) {
 *     return <div>MCP server not available. Please load the MCP server script.</div>;
 *   }
 *
 *   // You would initialize your client and transport here before using the Provider
 *
 *   return (
 *     <McpProvider transport={transport} mcpClient={client}>
 *       <MyApp />
 *     </McpProvider>
 *   );
 * }
 * ```
 */
export function checkBrowserMcpAvailability(globalNamespace: string = 'mcp'): boolean {
  return isBrowserMcpEnvironment(globalNamespace);
}
