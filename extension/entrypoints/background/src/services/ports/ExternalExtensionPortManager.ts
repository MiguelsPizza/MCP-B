import { ExtensionServerTransport } from '@mcp-b/transports';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { markExternalServerDisconnected, upsertExternalServer } from '../storage/externalServers';

interface ExternalConnection {
  server: McpServer;
  transport: ExtensionServerTransport;
}

/**
 * Manages connections from other extensions via onConnectExternal.
 * Persists connected external extension servers in WXT storage.
 */
export function initExternalExtensionPortListener(
  serverFactory: (extensionId: string) => McpServer
) {
  const connectionsByExtensionId = new Map<string, ExternalConnection>();

  chrome.runtime.onConnectExternal.addListener((port) => {
    const extensionId = port.sender?.id;
    if (!extensionId) return;

    // Close existing connection if present
    const existing = connectionsByExtensionId.get(extensionId);
    if (existing) {
      try {
        existing.server.close();
      } catch {}
      try {
        existing.transport.close();
      } catch {}
      connectionsByExtensionId.delete(extensionId);
    }

    const server = serverFactory(extensionId);
    const transport = new ExtensionServerTransport(port, {
      keepAlive: true,
      keepAliveInterval: 25_000,
    });
    server.connect(transport);

    connectionsByExtensionId.set(extensionId, { server, transport });

    // Persist connection info
    void upsertExternalServer(extensionId, {
      name: extensionId,
      lastConnectedAt: Date.now(),
    });

    port.onDisconnect.addListener(() => {
      const tracked = connectionsByExtensionId.get(extensionId);
      if (tracked) {
        try {
          tracked.server.close();
        } catch {}
        try {
          tracked.transport.close();
        } catch {}
        connectionsByExtensionId.delete(extensionId);
      }
      void markExternalServerDisconnected(extensionId);
    });
  });
}
