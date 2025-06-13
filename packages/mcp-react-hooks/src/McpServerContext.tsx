import { createContext, ReactElement, ReactNode, useContext } from 'react';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

interface McpServerContextValue {
  server: McpServer;
}

const McpServerContext = createContext<McpServerContextValue | null>(null);

export interface McpServerProviderProps {
  children: ReactNode;
  /**
   * A pre-configured McpServer instance.
   * For stability, the server should be created outside of the React lifecycle
   * and connected to its transport before being passed to this provider.
   */
  server: McpServer;
}

/**
 * Provider component that makes a single McpServer instance available
 * to all child components.
 *
 * @example
 * ```tsx
 * // In your server's entry point
 * import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
 * import { TabServerTransport } from '@mcp-b/transports';
 *
 * const server = new McpServer({ name: 'MyWebAppServer', version: '1.0.0' });
 * const transport = new TabServerTransport();
 *
 * // Connect the server outside of React
 * await server.connect(transport);
 *
 * function App() {
 *   return (
 *     <McpServerProvider server={server}>
 *       <MyServerUI />
 *     </McpServerProvider>
 *   );
 * }
 * ```
 */
export function McpServerProvider({ children, server }: McpServerProviderProps): ReactElement {
  return <McpServerContext.Provider value={{ server }}>{children}</McpServerContext.Provider>;
}

/**
 * Hook to access the shared McpServer instance.
 * Must be used within an McpServerProvider.
 *
 * This hook allows you to dynamically register and unregister tools, resources,
 * and prompts from within your React components.
 *
 * @returns The shared McpServer instance.
 * @throws Error if used outside of McpServerProvider.
 */
export function useMcpServer(): McpServer {
  const context = useContext(McpServerContext);
  if (!context) {
    throw new Error('useMcpServer must be used within an McpServerProvider');
  }
  return context.server;
}
