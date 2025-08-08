import { MCP_SERVERS } from "../config/mcp_config";
import { TabServerTransport } from "@mcp-b/transports";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// const modules = import.meta.glob('./*MCPServer.ts');
const modules = import.meta.glob('./*.ts');

let currentServer: McpServer | null = null;

export async function setupMCPServer(serverType: string): Promise<McpServer> {
  console.log(`👤 Setting up ${serverType} MCP Server...`);

  if (currentServer) {
    console.log('🔌 Closing existing MCP server...');
    await currentServer.close();
    currentServer = null;
  }

  const serverName = MCP_SERVERS[serverType as keyof typeof MCP_SERVERS].label;
  const path = MCP_SERVERS[serverType as keyof typeof MCP_SERVERS].serverPath;
  
  if (!modules[path]) {
    throw new Error(`Unknown server type: ${serverType}`);
  }

  const module = await modules[path]();

  console.log(module)

  const createMcpServer = (module as { createMcpServer: () => McpServer }).createMcpServer;

  try {
    const transport: TabServerTransport = new TabServerTransport({
      allowedOrigins: ['*']
    });

    const server = createMcpServer();
    await server.connect(transport);

    console.log(`✅ ${serverName} MCP Server connected and ready`);
    currentServer = server;
    return server;
  } catch (error) {
    console.error(`❌ Error setting up ${serverName} MCP Server:`, error);
    throw error;
  }
}
