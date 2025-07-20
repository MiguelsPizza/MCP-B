import {
  BACKGROUND_MESSAGE_TYPES,
  ERROR_MESSAGES,
  NATIVE_HOST,
  NativeMessageType,
  STORAGE_KEYS,
  SUCCESS_MESSAGES,
} from '@mcp-b/transports';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  type CallToolResult,
  ToolListChangedNotificationSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { clientTransport, serverTransport } from '../../inMemory';
import McpHub from './mcpHub';

/**
 * Tool call parameter interface
 */
export interface ToolCallParam {
  name: string;
  args: any;
}

export const createErrorResponse = (
  message: string = 'Unknown error, please try again'
): CallToolResult => {
  console.log(`[native] Creating error response: ${message}`);
  return {
    content: [
      {
        type: 'text',
        text: message,
      },
    ],
    isError: true,
  };
};

/**
 * Handle tool execution
 */
export const handleCallTool = async (
  param: ToolCallParam,
  client: Client
): Promise<CallToolResult> => {
  console.log(`[native] Handling tool call: ${param.name} with args:`, param.args);
  try {
    // @ts-ignore
    const result = await client.callTool({
      name: param.name,
      arguments: param.args,
    });
    console.log(`[native] Tool call successful for ${param.name}:`, result);
    // @ts-ignore
    return result;
  } catch (error) {
    console.error(`[native] Tool execution failed for ${param.name}:`, error);
    return createErrorResponse(
      error instanceof Error ? error.message : ERROR_MESSAGES.TOOL_EXECUTION_FAILED
    );
  }
};

let nativePort: chrome.runtime.Port | null = null;
export const HOST_NAME = NATIVE_HOST.NAME;

/**
 * Server status management interface
 */
interface ServerStatus {
  isRunning: boolean;
  port?: number;
  lastUpdated: number;
}

let currentServerStatus: ServerStatus = {
  isRunning: false,
  lastUpdated: Date.now(),
};

/**
 * Save server status to chrome.storage
 */
async function saveServerStatus(status: ServerStatus): Promise<void> {
  console.log(`[native] Saving server status:`, status);
  try {
    await chrome.storage.local.set({ [STORAGE_KEYS.SERVER_STATUS]: status });
    console.log(`[native] Server status saved successfully`);
  } catch (error) {
    console.error(`[native] ${ERROR_MESSAGES.SERVER_STATUS_SAVE_FAILED}:`, error);
  }
}

/**
 * Load server status from chrome.storage
 */
async function loadServerStatus(): Promise<ServerStatus> {
  console.log(`[native] Loading server status from storage`);
  try {
    const result = await chrome.storage.local.get([STORAGE_KEYS.SERVER_STATUS]);
    if (result[STORAGE_KEYS.SERVER_STATUS]) {
      console.log(`[native] Server status loaded:`, result[STORAGE_KEYS.SERVER_STATUS]);
      return result[STORAGE_KEYS.SERVER_STATUS];
    }
    console.log(`[native] No stored server status found, using default`);
  } catch (error) {
    console.error(`[native] ${ERROR_MESSAGES.SERVER_STATUS_LOAD_FAILED}:`, error);
  }
  return {
    isRunning: false,
    lastUpdated: Date.now(),
  };
}

/**
 * Broadcast server status change to all listeners
 */
function broadcastServerStatusChange(status: ServerStatus): void {
  console.log(`[native] Broadcasting server status change:`, status);
  chrome.runtime
    .sendMessage({
      type: BACKGROUND_MESSAGE_TYPES.SERVER_STATUS_CHANGED,
      payload: status,
    })
    .catch(() => {
      // Ignore errors if no listeners are present
      console.log(`[native] No listeners for server status change broadcast`);
    });
}

/**
 * Update and persist server status
 */
async function updateServerStatus(newStatus: Partial<ServerStatus>): Promise<void> {
  currentServerStatus = {
    ...currentServerStatus,
    ...newStatus,
    lastUpdated: Date.now(),
  };
  await saveServerStatus(currentServerStatus);
  broadcastServerStatusChange(currentServerStatus);
}

/**
 * Setup introspection tools for dynamic tool discovery and management
 *
 * These tools are essential for AI agents to understand the current state of available tools
 * in the MCP-B ecosystem. Since many MCP clients don't support live tool updates, these tools
 * allow the AI to actively check what tools are available when it expects changes.
 *
 * Key use cases:
 * 1. After navigating to a new website - check what website-specific tools became available
 * 2. After making changes to a website that might expose new tools - verify the tools were added
 * 3. When working across multiple websites - discover what domain-specific tools exist
 * 4. When debugging tool availability issues - list all tools by category
 *
 * The tools are categorized into:
 * - Website tools: Tools exposed by websites through their MCP servers (prefixed with domain)
 * - Extension tools: Tools provided by browser extensions
 * - Native tools: Tools from native MCP servers (everything else)
 */
function setupIntrospectionTools(server: McpServer, client: Client): void {
  /**
   * list_website_tools - Discover tools exposed by websites
   *
   * This tool is crucial for AI agents working with dynamic website tools. Since websites
   * can expose different tools based on:
   * - Current page/route (e.g., cart tools only on /cart page)
   * - User authentication state (admin tools for admins)
   * - Component lifecycle (tools appear/disappear with React components)
   *
   * The AI should call this tool:
   * - After navigating to a new website or page
   * - After performing actions that might change available tools
   * - When it needs to verify a specific domain has the expected tools
   *
   * Examples:
   * - domain: "amazon" - Lists all Amazon website tools
   * - domain: "google" - Lists all Google website tools
   * - domain: undefined - Lists ALL website tools from all domains
   */
  server.tool(
    'list_website_tools',
    'List all website tools for a given website. Use this after navigating to a new site or when you expect website tools to have changed (e.g., after login, page change, or component updates)',
    {
      domain: z
        .string()
        .describe(
          'The domain to list tools for. Examples: "google" for google.com, "amazon" for amazon.com. Leave empty to list ALL website tools from all domains.'
        )
        .optional()
        .default('website'),
    },
    async ({ domain }) => {
      const tools = await client.listTools();
      const filteredTools = domain
        ? tools.tools.filter((tool) => tool.name.includes(domain) && tool.name.includes('website'))
        : tools.tools.filter((tool) => tool.name.includes('website'));

      if (filteredTools.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: domain
                ? `No tools found for domain "${domain}". This could mean:\n` +
                  `1. The website doesn\'t have an MCP server\n` +
                  `2. You haven\'t navigated to the website yet\n` +
                  `3. The website\'s tools haven\'t loaded yet\n` +
                  `4. The domain name doesn\'t match (try variations)`
                : 'No website tools found. Navigate to a website with MCP support to see its tools.',
            },
          ],
          isError: false, // This isn't really an error, just no results
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                domain: domain || 'all',
                toolCount: filteredTools.length,
                tools: filteredTools.map((tool) => ({
                  name: tool.name,
                  description: tool.description,
                  inputSchema: tool.inputSchema,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  /**
   * list_extension_tools - Discover tools provided by browser extensions
   *
   * Extension tools are always available regardless of the current website. These include:
   * - Browser API tools (tabs, bookmarks, history, etc.)
   * - Cross-site automation tools
   * - Browser state management tools
   *
   * The AI should call this tool:
   * - When it needs to perform browser-level actions
   * - To discover what browser automation capabilities are available
   * - When planning cross-site workflows
   */
  server.tool(
    'list_extension_tools',
    'List all browser extension tools. These tools are always available and provide browser-level functionality like tab management, bookmarks, history, etc.',
    {},
    async () => {
      const tools = await client.listTools();
      const filteredTools = tools.tools.filter((tool) => tool.name.includes('extension'));

      if (filteredTools.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No extension tools found. This might indicate the MCP-B extension is not properly initialized.',
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                toolCount: filteredTools.length,
                tools: filteredTools.map((tool) => ({
                  name: tool.name,
                  description: tool.description,
                  category: tool.name.split('_')[1], // e.g., "tabs", "bookmarks", etc.
                  inputSchema: tool.inputSchema,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  /**
   * list_native_tools - Discover tools from native MCP servers
   *
   * This implicit tool (not explicitly defined but available through filtering)
   * lists all tools that are neither website tools nor extension tools.
   * These are typically tools from native MCP servers running on the user's machine.
   *
   * Note: This is currently handled in the message handlers by filtering out
   * website and extension tools from the full tool list.
   */

  /**
   * call_website_tool - Execute a tool from a website MCP server
   *
   * This tool allows the AI to call website-specific tools directly. Website tools are
   * dynamically registered by websites and may require being on the correct page/domain
   * to function properly.
   *
   * The AI should use this tool when:
   * - It needs to interact with website-specific functionality
   * - It has identified a website tool via list_website_tools and wants to execute it
   * - It's performing cross-site workflows and needs to call tools from specific domains
   *
   * Note: The tool execution happens in the context of the website, so authentication
   * and page state are automatically handled.
   */
  server.tool(
    'call_website_tool',
    'Execute a tool from a website MCP server. Use this to call website-specific tools that you discovered via list_website_tools.',
    {
      toolName: z
        .string()
        .describe('The exact name of the website tool to call (e.g., "amazon_website_addToCart")'),
      arguments: z
        .record(z.any())
        .describe('The arguments to pass to the tool as a key-value object')
        .optional()
        .default({}),
    },
    async ({ toolName, arguments: args }) => {
      console.log(`[native] Calling website tool: ${toolName} with args:`, args);

      try {
        // Verify this is actually a website tool
        const tools = await client.listTools();
        const tool = tools.tools.find(
          (t: any) => t.name === toolName && t.name.includes('website')
        );

        if (!tool) {
          return {
            content: [
              {
                type: 'text',
                text: `Website tool "${toolName}" not found. Use list_website_tools to see available tools. Make sure you're on the correct website.`,
              },
            ],
            isError: true,
          };
        }

        // Call the tool
        const result = await client.callTool({
          name: toolName,
          arguments: args,
        });

        console.log(`[native] Website tool call successful for ${toolName}:`, result);
        return result as any;
      } catch (error) {
        console.error(`[native] Website tool execution failed for ${toolName}:`, error);
        return createErrorResponse(
          error instanceof Error ? error.message : `Failed to execute website tool: ${toolName}`
        );
      }
    }
  );

  /**
   * call_extension_tool - Execute a browser extension tool
   *
   * This tool allows the AI to call browser extension tools directly. Extension tools
   * provide browser-level functionality and are always available regardless of the
   * current website.
   *
   * The AI should use this tool when:
   * - It needs to perform browser automation (manage tabs, bookmarks, etc.)
   * - It wants to access browser state or history
   * - It's performing cross-site workflows that require browser-level coordination
   *
   * Extension tools are more stable than website tools since they don't depend on
   * page state or navigation.
   */
  server.tool(
    'call_extension_tool',
    'Execute a browser extension tool. Use this to call extension tools that provide browser-level functionality like tab management, bookmarks, history, etc.',
    {
      toolName: z
        .string()
        .describe('The exact name of the extension tool to call (e.g., "extension_tabs_create")'),
      arguments: z
        .record(z.any())
        .describe('The arguments to pass to the tool as a key-value object')
        .optional()
        .default({}),
    },
    async ({ toolName, arguments: args }) => {
      console.log(`[native] Calling extension tool: ${toolName} with args:`, args);

      try {
        // Verify this is actually an extension tool
        const tools = await client.listTools();
        const tool = tools.tools.find(
          (t: any) => t.name === toolName && t.name.includes('extension')
        );

        if (!tool) {
          return {
            content: [
              {
                type: 'text',
                text: `Extension tool "${toolName}" not found. Use list_extension_tools to see available tools.`,
              },
            ],
            isError: true,
          };
        }

        // Call the tool
        const result = await client.callTool({
          name: toolName,
          arguments: args,
        });

        console.log(`[native] Extension tool call successful for ${toolName}:`, result);
        return result as any;
      } catch (error) {
        console.error(`[native] Extension tool execution failed for ${toolName}:`, error);
        return createErrorResponse(
          error instanceof Error ? error.message : `Failed to execute extension tool: ${toolName}`
        );
      }
    }
  );
}

/**
 * Setup MCP server and client
 */
async function setupMcp(): Promise<{ server: McpServer; client: Client }> {
  const server = new McpServer({
    name: 'Native-Host',
    version: '1.0.0',
  });

  new McpHub(server);

  await server.connect(serverTransport);

  const client = new Client({
    name: 'Native-Host',
    version: '1.0.0',
  });
  await client.connect(clientTransport);

  // Setup the introspection tools
  setupIntrospectionTools(server, client);

  return { server, client };
}

/**
 * Send response to native host
 */
function sendNativeResponse(requestId: string, payload: any): void {
  if (!nativePort) return;
  nativePort.postMessage({
    responseToRequestId: requestId,
    payload,
  });
  console.log(`[native] Sent response for request ${requestId}`);
}

/**
 * Message handlers for different native message types
 */
const createMessageHandlers = (client: Client) => ({
  [NativeMessageType.PROCESS_DATA]: async (message: any) => {
    if (!message.requestId) return;
    const { requestId, payload: requestPayload } = message;
    console.log(
      `[native] Processing PROCESS_DATA request ${requestId} with payload:`,
      requestPayload
    );

    sendNativeResponse(requestId, {
      status: 'success',
      message: SUCCESS_MESSAGES.TOOL_EXECUTED,
      data: requestPayload,
    });
  },

  [NativeMessageType.LIST_TOOLS]: async (message: any) => {
    if (!message.requestId) return;
    const { requestId } = message;
    console.log(`[native] Processing LIST_TOOLS request ${requestId}`);

    const { tools } = await client.listTools();
    console.log(`[native] List tools:`, tools);

    sendNativeResponse(requestId, {
      status: 'success',
      message: SUCCESS_MESSAGES.TOOL_EXECUTED,
      data: tools.filter(
        (tool) => !tool.name.startsWith('website') && !tool.name.startsWith('extension')
      ),
    });
  },

  // Note: The original code had 'request_data' as an alias for LIST_TOOLS, but it's handled under LIST_TOOLS here.
  // If it's a separate type, add it as another key.

  [NativeMessageType.CALL_TOOL]: async (message: any) => {
    if (!message.requestId || !message.payload) return;
    const { requestId, payload } = message;
    console.log(`[native] Processing CALL_TOOL request ${requestId} with payload:`, payload);

    try {
      const result = await handleCallTool(payload, client);
      sendNativeResponse(requestId, {
        status: 'success',
        message: SUCCESS_MESSAGES.TOOL_EXECUTED,
        data: result,
      });
      console.log(`[native] Sent successful CALL_TOOL response for request ${requestId}`);
    } catch (error) {
      console.error(`[native] Error handling CALL_TOOL request ${requestId}:`, error);
      sendNativeResponse(requestId, {
        status: 'error',
        message: ERROR_MESSAGES.TOOL_EXECUTION_FAILED,
        error: error instanceof Error ? error.message : String(error),
      });
      console.log(`[native] Sent error CALL_TOOL response for request ${requestId}`);
    }
  },

  [NativeMessageType.SERVER_STARTED]: async (message: any) => {
    const port = message.payload?.port;
    if (!port) return;
    console.log(`[native] Server started notification received for port ${port}`);
    await updateServerStatus({ isRunning: true, port });
    console.log(`[native] ${SUCCESS_MESSAGES.SERVER_STARTED} on port ${port}`);
  },

  [NativeMessageType.SERVER_STOPPED]: async () => {
    console.log(`[native] Server stopped notification received`);
    await updateServerStatus({ isRunning: false });
    console.log(`[native] ${SUCCESS_MESSAGES.SERVER_STOPPED}`);
  },

  [NativeMessageType.ERROR_FROM_NATIVE_HOST]: (message: any) => {
    const errorMessage = message.payload?.message || 'Unknown error';
    console.error(`[native] Error from native host: ${errorMessage}`);
  },

  [NativeMessageType.TOOL_LIST_UPDATED_ACK]: async (message: any) => {
    console.log(`[native] Tool list updated ack received`, JSON.stringify(message, null, 2));
  },
});

/**
 * Connect to the native messaging host
 */
export async function connectNativeHost(port: number = NATIVE_HOST.DEFAULT_PORT) {
  console.log(`[native] Attempting to connect to native host on port ${port}`);

  if (nativePort) {
    console.log(`[native] Native port already connected, skipping connection attempt`);
    return;
  }

  try {
    const { client } = await setupMcp();
    const messageHandlers = createMessageHandlers(client);

    console.log(`[native] Creating native port connection to ${HOST_NAME}`);
    nativePort = chrome.runtime.connectNative(HOST_NAME);

    nativePort.onMessage.addListener(async (message) => {
      console.log(`[native] Received message from native host:`, message);

      const handler = messageHandlers[message.type as keyof typeof messageHandlers];
      if (handler) {
        await handler(message);
      } else {
        console.log(`[native] Unhandled message type: ${message.type}`);
      }
    });

    nativePort.onDisconnect.addListener(() => {
      const lastError = chrome.runtime.lastError;
      console.error(
        `[native] ${ERROR_MESSAGES.NATIVE_DISCONNECTED}`,
        JSON.stringify(lastError, null, 2)
      );
      nativePort = null;
    });

    const startMessage = { type: NativeMessageType.START, payload: { port } };
    console.log(`[native] Sending START message to native host:`, startMessage);
    nativePort.postMessage(startMessage);

    console.log(`[native] Native host connection established successfully`);
  } catch (error) {
    console.error(`[native] ${ERROR_MESSAGES.NATIVE_CONNECTION_FAILED}:`, error);
  }
}

/**
 * Initialize native host listeners and load initial state
 */
export const initNativeHostListener = async () => {
  console.log(`[native] Initializing native host listener`);

  // Initialize server status from storage
  try {
    currentServerStatus = await loadServerStatus();
    console.log(`[native] Server status loaded:`, currentServerStatus);
  } catch (error) {
    console.error(`[native] ${ERROR_MESSAGES.SERVER_STATUS_LOAD_FAILED}:`, error);
  }

  await connectNativeHost(NATIVE_HOST.DEFAULT_PORT);

  console.log(`[native] Native host listener initialization complete`);
};
