import { config } from 'dotenv';
import path from 'node:path';

// Load environment variables from .env file
config({ path: path.resolve(__dirname, '../../.env') });

if (!process.env.DEV_EXTENSION_ID && process.env.NODE_ENV !== 'production') {
  console.warn('DEV_EXTENSION_ID is not defined in the environment variables.');
}

export const COMMAND_NAME = 'chrome-mcp-bridge';
export const EXTENSION_ID = 'daohopfhkdelnpemnhlekblhnikhdhfa'; // Published extension ID
export const DEV_EXTENSION_ID = process.env.DEV_EXTENSION_ID || 'bkepebjhaemmkpedklgoobliehbbnlng'// Development extension ID from .env
export const HOST_NAME = 'com.chromemcp.nativehost';
export const DESCRIPTION = 'Node.js Host for Browser Bridge Extension';
