import { createContext, useContext, type ReactNode } from 'react';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export interface MpcServerContextValue {
  server: McpServer;
}

const McpServerContext = createContext<MpcServerContextValue | null>(null);

export interface McpServerProviderProps {
  children: ReactNode;
  server: McpServer;
}

export function McpServerProvider({ children, server }: McpServerProviderProps) {
  const value: MpcServerContextValue = {
    server,
  };

  return <McpServerContext.Provider value={value}>{children}</McpServerContext.Provider>;
}

export function useMcpServer() {
  const context = useContext(McpServerContext);
  if (!context) {
    throw new Error('useMcpServer must be used within a McpServerProvider');
  }
  return context.server;
}
