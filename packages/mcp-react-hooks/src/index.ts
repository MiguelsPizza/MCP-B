// Server Provider
export { McpServerProvider, useMcpServer } from './McpServerContext';
export type { McpServerProviderProps } from './McpServerContext';

// Client Provider
export { McpClientProvider, useMcpClient } from './McpClientProvider';
export type { McpClientProviderProps } from './McpClientProvider';

// Memory Provider (combines both)
export { McpMemoryProvider } from './McpMemoryProvider';
export type { McpMemoryProviderProps } from './McpMemoryProvider';

// Legacy exports for backward compatibility
// export { McpProvider, useMcpContext, checkBrowserMcpAvailability } from './McpContext';
// export type { McpProviderProps } from './McpContext';

// // Legacy useMcpClient hook that uses McpContext
// export { useMcpClient as useMcpClientLegacy } from './useMcpClient';
// export type { UseMcpClientResult } from './useMcpClient';
