import { type ReactElement, type ReactNode, useMemo } from 'react';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpClientProvider } from './McpClientProvider';
import { McpServerProvider } from './McpServerContext';

export interface McpMemoryProviderProps {
  children: ReactNode;
  server: McpServer;
  client: Client;
}

/**
 * Provider component that creates both MCP client and server with an in-memory transport.
 * This is ideal for applications that need both client and server running in the same process.
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <McpMemoryProvider
 *       server={server}
 *     >
 *       <MyAppContent />
 *     </McpMemoryProvider>
 *   );
 * }
 * ```
 */
export function McpMemoryProvider({
  server,
  client,
  children,
}: McpMemoryProviderProps): ReactElement {
  // Create linked transport pair
  const [clientTransport, serverTransport] = useMemo(
    () => InMemoryTransport.createLinkedPair(),
    []
  );

  return (
    <McpServerProvider server={server} transport={serverTransport}>
      <McpClientProvider client={client} transport={clientTransport} opts={{}}>
        {children}
      </McpClientProvider>
    </McpServerProvider>
  );
}
