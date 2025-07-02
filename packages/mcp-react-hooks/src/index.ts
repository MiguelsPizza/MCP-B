// Server Provider

export type { McpClientProviderProps } from './McpClientProvider';
// Client Provider
export { McpClientProvider, useMcpClient } from './McpClientProvider';
export type { McpMemoryProviderProps } from './McpMemoryProvider';
// Memory Provider (combines both)
export { McpMemoryProvider } from './McpMemoryProvider';
export type { McpServerProviderProps } from './McpServerContext';
export { McpServerProvider, useMcpServer } from './McpServerContext';

// Legacy exports for backward compatibility
// export { McpProvider, useMcpContext, checkBrowserMcpAvailability } from './McpContext';
// export type { McpProviderProps } from './McpContext';

// // Legacy useMcpClient hook that uses McpContext
// export { useMcpClient as useMcpClientLegacy } from './useMcpClient';
// export type { UseMcpClientResult } from './useMcpClient';
