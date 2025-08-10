// UserScriptManager.ts

import { UserScriptClientTransport } from '@mcp-b/transports'; // Assuming this is where the transport is exported from
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';
import { ToolListChangedNotificationSchema } from '@modelcontextprotocol/sdk/types.js';

interface UserScriptClient {
  client: Client;
  transport: UserScriptClientTransport;
  domain: string;
  isConnected: boolean;
}

/**
 * Manages MCP clients for user scripts running in the background script.
 * This allows direct communication with user scripts without a proxy layer.
 */
export class UserScriptManager {
  private clients = new Map<string, UserScriptClient>();
  private server: McpServer;
  private onToolsUpdate: (domain: string, tools: Tool[]) => void;

  constructor(server: McpServer, onToolsUpdate: (domain: string, tools: Tool[]) => void) {
    this.server = server;
    this.onToolsUpdate = onToolsUpdate;
  }

  /**
   * Start a client for a user script domain
   */
  async startClient(domain: string, port: chrome.runtime.Port) {
    console.log(`[UserScriptManager] Starting client for domain: ${domain}`);

    // Clean up any existing client for this domain
    if (this.clients.has(domain)) {
      await this.stopClient(domain);
    }

    // Create new client
    const client = new Client({
      name: 'UserScriptClient',
      version: '1.0.0',
    });

    // Create transport using the domain as the port name
    const transport = new UserScriptClientTransport({
      portName: domain,
      autoReconnect: false, // We'll handle reconnection at a higher level
    });

    const userScriptClient: UserScriptClient = {
      client,
      transport,
      domain,
      isConnected: false,
    };

    this.clients.set(domain, userScriptClient);

    try {
      // Connect the client
      await client.connect(transport);
      userScriptClient.isConnected = true;

      console.log(`[UserScriptManager] Client connected for domain: ${domain}`);

      // Get initial tools
      await this.fetchAndUpdateTools(domain);

      // Get server capabilities
      const capabilities = await client.getServerCapabilities();
      console.log(`[UserScriptManager] Server capabilities for ${domain}:`, capabilities);

      // Set up tool change notifications if supported
      if (capabilities?.tools?.listChanged) {
        console.log(`[UserScriptManager] Setting up tool change notifications for ${domain}`);

        client.setNotificationHandler(ToolListChangedNotificationSchema, async () => {
          console.log(`[UserScriptManager] Tool list changed for ${domain}`);
          await this.fetchAndUpdateTools(domain);
        });
      }

      // Handle transport closure
      transport.onclose = () => {
        console.log(`[UserScriptManager] Transport closed for domain: ${domain}`);
        userScriptClient.isConnected = false;
        // Notify hub that tools should be cleared
        this.onToolsUpdate(domain, []);
      };

      transport.onerror = (error) => {
        console.error(`[UserScriptManager] Transport error for ${domain}:`, error);
      };
    } catch (error) {
      console.error(`[UserScriptManager] Failed to connect client for ${domain}:`, error);
      userScriptClient.isConnected = false;
      // Clean up on connection failure
      this.clients.delete(domain);
      throw error;
    }
  }

  /**
   * Stop a client for a user script domain
   */
  async stopClient(domain: string) {
    console.log(`[UserScriptManager] Stopping client for domain: ${domain}`);

    const userScriptClient = this.clients.get(domain);
    if (!userScriptClient) return;

    try {
      if (userScriptClient.transport) {
        await userScriptClient.transport.close();
      }
    } catch (error) {
      console.error(`[UserScriptManager] Error closing transport for ${domain}:`, error);
    }

    this.clients.delete(domain);
  }

  /**
   * Fetch tools from the user script and notify the hub
   */
  private async fetchAndUpdateTools(domain: string) {
    const userScriptClient = this.clients.get(domain);
    if (!userScriptClient || !userScriptClient.isConnected) {
      console.warn(`[UserScriptManager] No connected client for domain: ${domain}`);
      return;
    }

    try {
      const toolsResponse = await userScriptClient.client.listTools();
      const tools = toolsResponse.tools;

      console.log(`[UserScriptManager] Fetched ${tools.length} tools for ${domain}`);

      // Validate tools
      for (const tool of tools) {
        if (!tool.name) {
          console.error(`[UserScriptManager] Tool without name in ${domain}`);
        }
      }

      // Notify the hub about the tools update
      this.onToolsUpdate(domain, tools);
    } catch (error) {
      console.error(`[UserScriptManager] Failed to fetch tools for ${domain}:`, error);
      // On error, clear tools
      this.onToolsUpdate(domain, []);
    }
  }

  /**
   * Execute a tool on a user script
   */
  async executeTool(domain: string, toolName: string, args: any): Promise<CallToolResult> {
    const userScriptClient = this.clients.get(domain);

    if (!userScriptClient || !userScriptClient.isConnected) {
      throw new Error(`No connected user script client for domain: ${domain}`);
    }

    try {
      console.log(`[UserScriptManager] Executing tool '${toolName}' on ${domain}`);

      const result = await userScriptClient.client.callTool({
        name: toolName,
        arguments: args || {},
      });

      console.log(`[UserScriptManager] Tool execution succeeded for '${toolName}' on ${domain}`);

      return result as CallToolResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(
        `[UserScriptManager] Tool execution failed for '${toolName}' on ${domain}:`,
        error
      );

      return {
        content: [
          {
            type: 'text',
            text: errorMessage,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Check if a domain has a connected client
   */
  hasClient(domain: string): boolean {
    const client = this.clients.get(domain);
    return client?.isConnected ?? false;
  }

  /**
   * Get all connected domains
   */
  getConnectedDomains(): string[] {
    return Array.from(this.clients.entries())
      .filter(([_, client]) => client.isConnected)
      .map(([domain]) => domain);
  }

  /**
   * Cleanup all clients
   */
  async cleanup() {
    console.log('[UserScriptManager] Cleaning up all clients');

    const stopPromises = Array.from(this.clients.keys()).map((domain) =>
      this.stopClient(domain).catch((err) =>
        console.error(`[UserScriptManager] Error stopping client for ${domain}:`, err)
      )
    );

    await Promise.all(stopPromises);
    this.clients.clear();
  }
}
