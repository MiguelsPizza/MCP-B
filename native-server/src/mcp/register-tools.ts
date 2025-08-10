import { NativeMessageType } from '@mcp-b/transports';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  CallToolRequestSchema,
  type CallToolResult,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs';
import nativeMessagingHostInstance from '../native-messaging-host';
import { executeScriptToolOverride } from './inject-user-mcp';

export const setupTools = (server: McpServer) => {
  // List tools handler
  server.server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = await nativeMessagingHostInstance.sendRequestToExtensionAndWait(
      {},
      NativeMessageType.LIST_TOOLS,
      30000
    ) as { data: Tool[] }

    tools.data.filter(tool => tool.name === 'extension_tool_execute_user_script');
    tools.data.push(executeScriptToolOverride);
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
  server.server.setRequestHandler(CallToolRequestSchema, async (request) =>{
    if(request.params.name === 'extension_tool_execute_user_script'){
      if(!request.params.arguments?.filePath){
        return {
          content: [
            {
              type: 'text',
              text:
                'Missing required argument: filePath. Provide an absolute path to a local JavaScript userscript, e.g. /Users/yourname/project/scripts/example.user.js. The native host will read the file and the extension will inject it into the target tab.',
            },
          ],
          isError: true,
        };
      }
      const file = await fs.readFileSync(request.params.arguments.filePath as string, 'utf8')

      return handleToolCall('extension_tool_execute_user_script', {
        tabId: request.params.arguments?.tabId,
        code: file,
        allFrames: false,
        world: 'MAIN',
      })
    }
    return handleToolCall(request.params.name, request.params.arguments || {})
  }
  );
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
