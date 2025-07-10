import type { ZodProvider } from '@autoform/zod';
import type { Tool as McpTool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface McpErrorInfo {
  title: string;
  description: React.ReactNode;
}

export interface ToolInfo {
  domain: string;
  cleanName: string;
  tabId: number | null;
  isActive: boolean;
  tabIndex: number | null;
}

export interface InputSchema {
  properties?: Record<string, { type?: string; default?: unknown; enum?: string[] }>;
  required?: string[];
}

export interface ParamSchema {
  type?: string;
  enum?: string[];
  description?: string;
  format?: string;
  pattern?: string;
  default?: unknown;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
}

export interface ToolCardProps {
  tool: McpTool;
  isExpanded: boolean;
  onToggle: () => void;
  onCall: (toolName: string, data: unknown) => void;
  isCalling: boolean;
  schema?: ZodProvider<any>;
}
