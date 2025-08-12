import { NativeMessageType } from '@mcp-b/transports';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  CallToolRequestSchema,
  type CallToolResult,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs';
import nativeMessagingHostInstance from '../native-messaging-host';
import { executeScriptToolOverride, registerUserscriptToolOverride } from './inject-user-mcp';

export const setupTools = (server: McpServer) => {
  // List tools handler
  server.server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = (await nativeMessagingHostInstance.sendRequestToExtensionAndWait(
      {},
      NativeMessageType.LIST_TOOLS,
      30000
    )) as { data: Tool[] };

    // Filter out the original tools that we're overriding
    tools.data = tools.data.filter(
      (tool) =>
        tool.name !== 'extension_tool_execute_user_script' &&
        tool.name !== 'extension_tool_userscripts_register'
    );

    // Add our overridden tools that read files from disk
    tools.data.push(executeScriptToolOverride);
    tools.data.push(registerUserscriptToolOverride);

    // @ts-ignore
    return { tools: tools.data };
  });

  // server.server.setRequestHandler(ToolListChangedNotificationSchema, async () => {
  //   const tools = await nativeMessagingHostInstance.sendRequestToExtensionAndWait(
  //     {},
  //     NativeMessageType.LIST_TOOLS,
  //     30000
  //   );
  //   // @ts-ignore
  //   return { tools: tools.data };
  // });

  // nativeMessagingHostInstance.addMessageHandler(
  //   NativeMessageType.TOOL_LIST_UPDATED,
  //   async (message) => {
  //     const msg = message as { payload?: { tools?: Tool[] } };
  //     const tools = msg.payload?.tools;
  //     if (tools?.length) {
  //       tools.forEach((tool) => {
  //         server.registerTool(
  //           tool.name,
  //           {
  //             title: tool.name,
  //             description: tool.description,
  //             inputSchema: tool.inputSchema as any,
  //           },
  //           async (request: any) => {
  //             return await handleToolCall(request.params.name, request.params.arguments || {});
  //           }
  //         );
  //       });
  //     }

  //     server.sendToolListChanged();

  //     nativeMessagingHostInstance.sendMessage({
  //       type: NativeMessageType.TOOL_LIST_UPDATED_ACK,
  //     });
  //   }
  // );

  // Call tool handler
  server.server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === 'extension_tool_execute_user_script') {
      if (!request.params.arguments?.filePath) {
        return {
          content: [
            {
              type: 'text',
              text: 'Missing required argument: filePath. Provide an absolute path to a local JavaScript userscript, e.g. /Users/yourname/project/scripts/example.user.js. The native host will read the file and the extension will inject it into the target tab.',
            },
          ],
          isError: true,
        };
      }
      const file = fs.readFileSync(request.params.arguments.filePath as string, 'utf8');

      return handleToolCall('extension_tool_execute_user_script', {
        tabId: request.params.arguments?.tabId,
        code: file,
        allFrames: false,
        world: 'MAIN',
      });
    }

    if (request.params.name === 'extension_tool_userscripts_register') {
      if (!request.params.arguments?.filePath) {
        return {
          content: [
            {
              type: 'text',
              text: 'Missing required argument: filePath. Provide an absolute path to a local JavaScript userscript, e.g. /Users/yourname/project/scripts/example.user.js. The native host will read the file and register it as a persistent userscript.',
            },
          ],
          isError: true,
        };
      }

      if (!request.params.arguments?.id || !request.params.arguments?.matches) {
        return {
          content: [
            {
              type: 'text',
              text: 'Missing required arguments: id and matches are required. id should be a unique identifier for the script, and matches should be an array of URL patterns.',
            },
          ],
          isError: true,
        };
      }

      const file = fs.readFileSync(request.params.arguments.filePath as string, 'utf8');

      // Build the registration parameters with MCP-B optimized defaults
      const registrationParams: any = {
        id: request.params.arguments.id,
        matches: request.params.arguments.matches,
        js: [{ code: file }],
      };

      // Add optional parameters if provided
      if (request.params.arguments.excludeMatches) {
        registrationParams.excludeMatches = request.params.arguments.excludeMatches;
      }
      if (request.params.arguments.allFrames !== undefined) {
        registrationParams.allFrames = request.params.arguments.allFrames;
      }

      // Set runAt with document_start as the recommended default for MCP-B userscripts
      if (request.params.arguments.runAt) {
        registrationParams.runAt = request.params.arguments.runAt;
      } else {
        registrationParams.runAt = 'document_start'; // Default to document_start for MCP-B userscripts
      }

      // Set world with MAIN as the recommended default for MCP-B userscripts
      if (request.params.arguments.world) {
        registrationParams.world = request.params.arguments.world;
      } else {
        registrationParams.world = 'MAIN'; // Default to MAIN for MCP-B userscripts to interact with page
      }

      // Only set worldId if using USER_SCRIPT world
      if (request.params.arguments.worldId && registrationParams.world === 'USER_SCRIPT') {
        registrationParams.worldId = request.params.arguments.worldId;
      }

      return handleToolCall('extension_tool_userscripts_register', registrationParams);
    }

    return handleToolCall(request.params.name, request.params.arguments || {});
  });
};

const handleToolCall = async (name: string, args: any): Promise<CallToolResult> => {
  try {
    // 发送请求到Chrome扩展并等待响应
    const response = await nativeMessagingHostInstance.sendRequestToExtensionAndWait(
      {
        name,
        args,
      },
      NativeMessageType.CALL_TOOL,
      30000 // 30秒超时
    );
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response),
        },
      ],
      isError: false,
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error calling tool: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
};
