// mcphub.ts

import { sanitizeToolName } from '@/entrypoints/sidepanel/components/McpServer/utils';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { RequestManager } from '../lib/utils'; // Assume this handles request IDs.
import { ExtensionToolsService } from './ExtensionToolsService';

interface TabData {
  tools: Tool[];
  lastUpdated: number;
  url: string;
  tabId?: number; // For open tabs only.
  port?: chrome.runtime.Port;
  isClosed: boolean;
}

export default class McpHub {
  private server: McpServer;
  private domains = new Map<string, Map<string, TabData>>(); // domain → dataId → TabData (dataId: 'tab-${tabId}' or 'cached-${timestamp}')
  private activeTabId: number | null = null;
  private requestManager = new RequestManager();
  private registeredTools = new Map<string, ReturnType<typeof this.server.registerTool>>();
  private pendingReopens = new Map<
    number,
    {
      cachedDataId: string;
      resolvePort: (port: chrome.runtime.Port) => void;
      reject: (err: any) => void;
      timeoutId: NodeJS.Timeout;
    }
  >(); // For awaiting reopen registration.

  constructor(server: McpServer) {
    this.server = server;
    this.registerStaticTools();
    this.setupConnections();
    this.trackActiveTab();
  }

  private registerStaticTools() {
    const extensionToolsService = new ExtensionToolsService(this.server, {
      tabs: {
        getAllTabs: true,
        createTab: true,
        closeTabs: true,
        updateTab: true,
      },
      scripting: {
        executeScript: false,
        executeUserScript: true,
        insertCSS: false,
        removeCSS: false,
      },
    });
    extensionToolsService.registerAllTools();
  }

  private getDomainData(domain: string): Map<string, TabData> {
    if (!this.domains.has(domain)) {
      this.domains.set(domain, new Map());
    }
    return this.domains.get(domain)!;
  }

  private extractDomainFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
        ? `localhost:${urlObj.port || '80'}`
        : hostname;
    } catch {
      return 'unknown';
    }
  }

  private setupConnections() {
    chrome.runtime.onConnect.addListener((port) => {
      if (port.name === 'mcp-content-script-proxy') {
        this.handleContentScriptConnection(port);
      }
    });
  }

  private requestToolsFromTab(domain: string, dataId: string) {
    const domainData = this.getDomainData(domain);
    const tabData = domainData.get(dataId);
    if (tabData && !tabData.isClosed && tabData.port) {
      tabData.port.postMessage({ type: 'request-tools-refresh' });
    }
  }

  private handleContentScriptConnection(port: chrome.runtime.Port) {
    const tabId = port.sender?.tab?.id;
    const url = port.sender?.tab?.url || '';
    if (!tabId) return;

    const domain = this.extractDomainFromUrl(url);
    const dataId = `tab-${tabId}`;

    port.onMessage.addListener(async (message) => {
      if (message.type === 'register-tools' && message.tools) {
        await this.registerOrUpdateTools(domain, dataId, port, message.tools, true);
        // Check if this is a reopen: Resolve pending if matching.
        const pending = this.pendingReopens.get(tabId);
        if (pending) {
          clearTimeout(pending.timeoutId);
          pending.resolvePort(port);
          // Cleanup cached after reopen
          const cachedDataId = pending.cachedDataId;
          this.unregisterTools(domain, cachedDataId);
          this.getDomainData(domain).delete(cachedDataId);
          this.pendingReopens.delete(tabId);
        }
      } else if (message.type === 'tools-updated' && message.tools) {
        await this.registerOrUpdateTools(domain, dataId, port, message.tools, false);
      } else if (message.type === 'tool-result' && message.requestId) {
        this.requestManager.resolve(message.requestId, message.data);
      }
    });

    port.onDisconnect.addListener(() => {
      this.unregisterTab(domain, dataId);
    });
  }

  private async registerOrUpdateTools(
    domain: string,
    dataId: string,
    port: chrome.runtime.Port,
    tools: Tool[],
    isRegister: boolean
  ) {
    const domainData = this.getDomainData(domain);
    const existing = domainData.get(dataId);
    const tabData: TabData = {
      tools,
      lastUpdated: Date.now(),
      url: port.sender?.tab?.url || '',
      tabId: port.sender?.tab?.id,
      port,
      isClosed: false,
    };
    domainData.set(dataId, tabData);

    // Ensure we have the current active tab ID before registering tools
    if (this.activeTabId === null) {
      await this.initializeActiveTab();
    }

    const cleanedDomain = sanitizeToolName(domain);
    const namePrefix = dataId.startsWith('cached-') ? dataId : `tab${tabData.tabId}`; // Use tabId numerically for open, full dataId for cached.

    for (const tool of tools) {
      const toolName = `website_tool_${cleanedDomain}_${namePrefix}_${sanitizeToolName(tool.name)}`;
      const description = this.getSimpleTabDescription(domain, dataId, tool.description || '');

      const inputSchema: Record<string, z.ZodAny> = {};
      for (const key in tool.inputSchema.properties ?? {}) {
        inputSchema[key] = z.any();
      }

      const outputSchema: Record<string, z.ZodAny> | undefined = tool.outputSchema?.properties
        ? Object.fromEntries(Object.keys(tool.outputSchema.properties).map((key) => [key, z.any()]))
        : undefined;

      const config = {
        title: tool.title,
        description,
        inputSchema: inputSchema as any,
        outputSchema: outputSchema as any,
        annotations: tool.annotations,
      };

      if (this.registeredTools.has(toolName)) {
        this.registeredTools.get(toolName)!.update(config);
      } else {
        const mcpTool = this.server.registerTool(toolName, config, async (args: any) =>
          this.executeTool(domain, dataId, tool.name, args)
        );
        this.registeredTools.set(toolName, mcpTool);
      }
    }

    if (!isRegister) {
      // Clean up removed tools.
      const oldTools = existing?.tools || [];
      const removed = oldTools.filter((t) => !tools.some((nt) => nt.name === t.name));
      for (const tool of removed) {
        const toolName = `website_tool_${cleanedDomain}_${namePrefix}_${sanitizeToolName(tool.name)}`;
        this.registeredTools.get(toolName)?.remove();
        this.registeredTools.delete(toolName);
      }
    }
  }

  private unregisterTab(domain: string, dataId: string) {
    const domainData = this.getDomainData(domain);
    const tabData = domainData.get(dataId);
    if (!tabData) return;

    this.unregisterTools(domain, dataId);

    const cacheable = tabData.tools.filter((t) => t.annotations?.cache);
    if (cacheable.length > 0 && !tabData.isClosed) {
      // Only cache if was open.
      const cachedId = `cached-${Date.now()}`;
      domainData.set(cachedId, {
        ...tabData,
        tools: cacheable,
        isClosed: true,
        tabId: undefined,
        port: undefined,
      });
      this.registerCachedTools(domain, cachedId);
    }
    domainData.delete(dataId);
  }

  private registerCachedTools(domain: string, dataId: string) {
    const domainData = this.getDomainData(domain);
    const tabData = domainData.get(dataId);
    if (!tabData) return;

    const cleanedDomain = sanitizeToolName(domain);
    const namePrefix = dataId;

    for (const tool of tabData.tools) {
      const toolName = `website_tool_${cleanedDomain}_${namePrefix}_${sanitizeToolName(tool.name)}`;
      const description = this.getSimpleTabDescription(domain, dataId, tool.description || '');

      const inputSchema: Record<string, z.ZodAny> = {};
      for (const key in tool.inputSchema.properties ?? {}) {
        inputSchema[key] = z.any();
      }

      const outputSchema: Record<string, z.ZodAny> | undefined = tool.outputSchema?.properties
        ? Object.fromEntries(Object.keys(tool.outputSchema.properties).map((key) => [key, z.any()]))
        : undefined;

      const config = {
        title: tool.title,
        description,
        inputSchema: inputSchema as any,
        outputSchema: outputSchema as any,
        annotations: tool.annotations,
      };

      const mcpTool = this.server.registerTool(toolName, config, async (args: any) =>
        this.executeTool(domain, dataId, tool.name, args)
      );
      this.registeredTools.set(toolName, mcpTool);
    }
  }

  private unregisterTools(domain: string, dataId: string) {
    const domainData = this.getDomainData(domain);
    const tabData = domainData.get(dataId);
    if (!tabData) return;

    const cleanedDomain = sanitizeToolName(domain);
    const namePrefix = dataId.startsWith('cached-') ? dataId : `tab${tabData.tabId ?? ''}`;

    for (const tool of tabData.tools) {
      const toolName = `website_tool_${cleanedDomain}_${namePrefix}_${sanitizeToolName(tool.name)}`;
      this.registeredTools.get(toolName)?.remove();
      this.registeredTools.delete(toolName);
    }
  }

  private async getPortForDataId(domain: string, dataId: string): Promise<chrome.runtime.Port> {
    const domainData = this.getDomainData(domain);
    const tabData = domainData.get(dataId);
    if (!tabData) throw new Error(`No data for ${dataId}`);

    if (!tabData.isClosed) {
      if (tabData.tabId && tabData.tabId !== this.activeTabId) {
        await chrome.tabs.update(tabData.tabId, { active: true });
      }
      if (!tabData.port) throw new Error('No port for open tab');
      return tabData.port;
    }

    // Reopen cached tab.
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingReopens.forEach((p, id) => {
          if (p.cachedDataId === dataId) {
            this.pendingReopens.delete(id);
          }
        });
        reject(new Error('Timeout reopening tab'));
      }, 10000);

      chrome.tabs.create({ url: tabData.url, active: true }, (newTab) => {
        if (chrome.runtime.lastError || !newTab?.id) {
          clearTimeout(timeoutId);
          reject(new Error('Failed to create tab: ' + chrome.runtime.lastError?.message));
          return;
        }
        this.pendingReopens.set(newTab.id, {
          cachedDataId: dataId,
          resolvePort: resolve,
          reject,
          timeoutId,
        });
      });
    });
  }

  private getSimpleTabDescription(domain: string, dataId: string, original: string): string {
    const domainData = this.getDomainData(domain);
    const tabData = domainData.get(dataId);
    if (!tabData) return `[${domain}] ${original}`;

    const isActive = !tabData.isClosed && tabData.tabId === this.activeTabId;
    const status = isActive ? 'Active' : tabData.isClosed ? 'Cached' : '';
    return `[${domain} • ${status ? `${status} ` : ''}Tab] ${original}`;
  }

  private async executeTool(
    domain: string,
    dataId: string,
    toolName: string,
    args: any
  ): Promise<CallToolResult> {
    try {
      const port = await this.getPortForDataId(domain, dataId);
      return await this.requestManager.create(port, { type: 'execute-tool', toolName, args });
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to execute tool: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  private trackActiveTab() {
    // Initialize with current active tab
    this.initializeActiveTab();

    chrome.tabs.onActivated.addListener(async (activeInfo) => {
      const previousActiveTabId = this.activeTabId;
      this.activeTabId = activeInfo.tabId;

      if (previousActiveTabId && previousActiveTabId !== this.activeTabId) {
        try {
          const prevTab = await chrome.tabs.get(previousActiveTabId);
          if (prevTab.url) {
            const prevDomain = this.extractDomainFromUrl(prevTab.url);
            const prevDataId = `tab-${previousActiveTabId}`;
            this.updateToolDescriptions(prevDomain, prevDataId);
          }
        } catch (e) {
          // Tab might be closed or other error, ignore
        }
      }

      try {
        const tab = await chrome.tabs.get(this.activeTabId);
        if (!tab.url) return;
        const domain = this.extractDomainFromUrl(tab.url);
        const dataId = `tab-${this.activeTabId}`;
        this.updateToolDescriptions(domain, dataId);
        this.requestToolsFromTab(domain, dataId);
      } catch (e) {
        // Handle error if needed
      }
    });
  }

  private async initializeActiveTab() {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab?.id) {
        this.activeTabId = activeTab.id;
      }
    } catch (e) {
      // Handle error if needed
    }
  }

  private updateToolDescriptions(domain: string, dataId: string) {
    const domainData = this.getDomainData(domain);
    const tabData = domainData.get(dataId);
    if (!tabData || tabData.isClosed || !tabData.tabId) return;

    const cleanedDomain = sanitizeToolName(domain);
    const namePrefix = `tab${tabData.tabId}`;

    for (const tool of tabData.tools) {
      const toolName = `website_tool_${cleanedDomain}_${namePrefix}_${sanitizeToolName(tool.name)}`;
      const description = this.getSimpleTabDescription(domain, dataId, tool.description || '');

      if (this.registeredTools.has(toolName)) {
        this.registeredTools.get(toolName)!.update({ description });
      }
    }
  }

  // Cleanup method if needed...
}
