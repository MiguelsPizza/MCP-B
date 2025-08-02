// Configuration

export type MCP_SERVERS_CONFIG = {
  label: string;
  position: { x: number; y: number };
  url: string;
  serverPath: string;
};

export const MCP_SERVERS = {
    'weather': {
      label: 'Weather MCP',
      position: { x: 400, y: 200 },
      url: 'mcp://weather-mcp',
       serverPath: './weather.ts',
    },
    'userTable': {
      label: 'Users MCP',
      position: { x: 400, y: 350 },
      url: 'mcp://users-mcp',
       serverPath: './userTable.ts',
    },
    'math': {
      label: 'Math MCP',
      position: { x: 400, y: 500 },
      url: 'mcp://math-mcp',
       serverPath: './math.ts',
    },
    'github': {
      label: 'GitHub MCP',
      position: { x: 400, y: 650 },
      url: 'mcp://github-mcp',
       serverPath: './github.ts',
    }
  } as const;