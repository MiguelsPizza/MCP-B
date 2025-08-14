import { type Node, type NodeTypes } from 'reactflow';

import { MCP_SERVERS, type MCP_SERVERS_CONFIG } from '../config/mcp_config.ts';
import type { LiveConfig, MCPTool } from './live-types.ts';

import { type FunctionDeclaration } from '@google/generative-ai';

import { CONST_CONFIG, LLM_CONFIG } from '../config/ai_config';

export type GetAudioContextOptions = AudioContextOptions & {
  id?: string;
};

const map: Map<string, AudioContext> = new Map();

export const audioContext: (options?: GetAudioContextOptions) => Promise<AudioContext> = (() => {
  const didInteract = new Promise((res) => {
    window.addEventListener('pointerdown', res, { once: true });
    window.addEventListener('keydown', res, { once: true });
  });

  return async (options?: GetAudioContextOptions) => {
    try {
      const a = new Audio();
      a.src =
        'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      await a.play();
      if (options?.id && map.has(options.id)) {
        const ctx = map.get(options.id);
        if (ctx) {
          return ctx;
        }
      }
      const ctx = new AudioContext(options);
      if (options?.id) {
        map.set(options.id, ctx);
      }
      return ctx;
    } catch (e) {
      await didInteract;
      if (options?.id && map.has(options.id)) {
        const ctx = map.get(options.id);
        if (ctx) {
          return ctx;
        }
      }
      const ctx = new AudioContext(options);
      if (options?.id) {
        map.set(options.id, ctx);
      }
      return ctx;
    }
  };
})();

export const blobToJSON = (blob: Blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        const json = JSON.parse(reader.result as string);
        resolve(json);
      } else {
        reject('oops');
      }
    };
    reader.readAsText(blob);
  });

export function base64ToArrayBuffer(base64: string) {
  var binaryString = atob(base64);
  var bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Helper functions
export const createMCPServerNode = (id: string, config: MCP_SERVERS_CONFIG): Node => ({
  id,
  type: 'mcpServer',
  position: config.position,
  data: {
    label: config.label,
    url: config.url,
    description: `${config.label} - Not connected`,
    connected: false,
  },
});

export const isMCPServer = (nodeId: string | null): nodeId is keyof typeof MCP_SERVERS => {
  if (!nodeId) return false;

  return nodeId in MCP_SERVERS;
};

export const initialNodes: Node[] = [
  {
    id: CONST_CONFIG.LLM_NODE_ID,
    type: 'llm',
    position: { x: 100, y: 150 },
    data: { label: 'Gemini LLM' },
  },
  ...Object.entries(MCP_SERVERS).map(([id, config]) => createMCPServerNode(id, config)),
];

export const getServerName = (serverId: string): string => {
  return isMCPServer(serverId) ? MCP_SERVERS[serverId].label : serverId;
};

// CONVERT MCP PARAMETERS TO GEMINI LIVE API FORMAT
export const convertMCPParams = (params: any): any => {
  if (!params || !params.properties) {
    return {};
  }

  const properties: any = {};
  for (const [key, value] of Object.entries(params.properties)) {
    const param = value as any;
    properties[key] = {
      type: param.type || 'string',
      description: param.description || key,
      // Add format and other OpenAPI schema properties if they exist
      ...(param.format && { format: param.format }),
      ...(param.enum && { enum: param.enum }),
      ...(param.items && { items: param.items }),
    };
  }

  return properties;
};

// CREATE LIVE CONFIG WITH MCP TOOLS
export const createLiveConfigWithTools = (mcpTools: MCPTool[]): LiveConfig => {
  if (mcpTools.length === 0) {
    return LLM_CONFIG;
  }

  // console.log('🔧 Converting MCP tools to Live API format:', mcpTools);

  // Convert MCP tools to proper Live API FunctionDeclaration format
  const mcpFunctionDeclarations = mcpTools.map((tool) => {
    const functionDeclaration = {
      name: tool.name,
      description: tool.description || `Execute ${tool.name}`,
      parameters: {
        type: 'object',
        properties: convertMCPParams(tool.parameters),
        required: tool.parameters?.required || [],
      },
    };

    // console.log(`📋 Function declaration for ${tool.name}:`, functionDeclaration);
    return functionDeclaration;
  });

  // Create the tools array in the correct LiveConfig format
  const tools: LiveConfig['tools'] = [
    {
      functionDeclarations: mcpFunctionDeclarations as FunctionDeclaration[],
    },
  ];

  // console.log('🎯 Final Live API config tools:', tools);

  return {
    ...LLM_CONFIG,
    tools: tools,
  };
};
