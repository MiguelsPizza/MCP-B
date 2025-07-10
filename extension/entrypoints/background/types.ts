import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface TabToolInfo {
  port: chrome.runtime.Port;
  tools: Tool[];
  url?: string;
  domain?: string;
  timestamp: number;
  domainIndex?: number;
  isActive?: boolean;
}

/**
 * Types for request/response communication
 */
export interface PendingRequest<T = unknown> {
  resolve: (value: T) => void;
  reject: (reason?: Error) => void;
}

export interface RequestResponse<T = unknown> {
  success: boolean;
  payload: T;
}
