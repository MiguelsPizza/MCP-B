import { sanitizeToolName } from '@/entrypoints/sidepanel/components/McpServer/utils';
import { ExtensionServerTransport } from '@mcp-b/transports';
import type { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { RequestManager } from '../lib/utils';
import { DomainToolManager } from './DomainToolManager';
import { ExtensionToolsService } from './ExtensionToolsService';

/**
 * MCP Hub that aggregates tools from multiple tabs and exposes them to UI clients
 *
 * Uses simplified tool naming:
 * - Extension tools: extension_tool_{toolName}
 * - Website tools: website_tool_{toolName}
 *
 * Domain information is stored in tool descriptions
 */
export default class McpHub {
  private server: McpServer;
  private domainToolManager = new DomainToolManager();
  private requestManager = new RequestManager();
  private extensionTools: ExtensionToolsService;
  private registeredTools = new Map<string, ReturnType<typeof this.server.registerTool>>();
  private type: 'Extension' | 'Native';
  private bridgeServerTransport?: InMemoryTransport;

  constructor(type: 'Extension' | 'Native', transport?: InMemoryTransport) {
    this.server = new McpServer({
      name: 'Extension-Hub',
      version: '1.0.0',
    });
    this.bridgeServerTransport = transport;

    this.type = type;
    this.extensionTools = new ExtensionToolsService(this.server, {});
    this.setupHubTools();
    this.setupConnections();
    this.trackActiveTab();
    // Load existing domain tools from storage
    this.loadExistingDomainTools().catch(console.error);
  }

  private async loadExistingDomainTools() {
    // Load and register all domain tools from storage
    const allDomainTools = this.domainToolManager.getAllDomainTools();

    for (const [domain, domainData] of allDomainTools) {
      for (const tool of domainData.tools) {
        // Only register tools that have caching enabled
        if (tool.annotations?.cache === true) {
          this.registerWebsiteTool(domain, tool);
        }
      }
    }
  }

  private trackActiveTab() {
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
      console.log(`[MCP Hub] Tab ${activeInfo.tabId} activated`);

      // First, re-register tools for the newly active tab
      await this.reregisterToolsForActiveTab(activeInfo.tabId);

      // Then unregister non-cached tools from all inactive tabs
      await this.unregisterNonCachedToolsFromInactiveTabs(activeInfo.tabId);

      // Refresh all tool descriptions when active tab changes
      this.refreshAllToolDescriptions();
    });
  }

  private refreshAllToolDescriptions() {
    const allDomainTools = this.domainToolManager.getAllDomainTools();

    for (const [domain] of allDomainTools) {
      this.refreshDomainToolDescriptions(domain);
    }
  }

  private async refreshDomainToolDescriptions(domain: string) {
    const domainTools = this.domainToolManager.getToolsForDomain(domain);
    const cleanedDomain = sanitizeToolName(domain);

    for (const tool of domainTools) {
      const toolName = `website_tool_${cleanedDomain}_${sanitizeToolName(tool.name)}`;
      const mcpTool = this.registeredTools.get(toolName);

      if (mcpTool) {
        const description = await this.domainToolManager.getDomainDescription(
          domain,
          tool.description
        );
        try {
          mcpTool.update({
            description,
          });
        } catch (error) {
          console.warn(`[MCP Hub] Failed to update tool ${toolName}:`, error);
        }
      }
    }
  }

  private setupHubTools() {
    // Register all extension-specific tools
    this.extensionTools.registerAllTools();
  }

  private setupConnections() {
    chrome.runtime.onConnect.addListener((port) => {
      if (port.name === 'mcp-content-script-proxy') {
        this.handleContentScriptConnection(port);
      } else if (port.name === 'mcp') {
        if (this.type === 'Extension') this.handleUiConnection(port);
      }
    });

    // Don't auto-connect if Native, let the caller handle it
    if (this.type === 'Native' && !this.bridgeServerTransport) {
      console.log('[MCP Hub] Native mode initialized, waiting for explicit connection');
    }
  }

  async connectToBridge() {
    if (!this.bridgeServerTransport) {
      throw new Error('Bridge server transport not found');
    }
    try {
      await this.server.connect(this.bridgeServerTransport);
      console.log('[MCP Hub] Successfully connected to bridge');
    } catch (error) {
      console.error('[MCP Hub] Failed to connect to bridge after all retries:', error);
      // The transport will handle all retries internally, so we don't need to retry here
      throw error;
    }
  }

  private async handleUiConnection(port: chrome.runtime.Port) {
    console.log('[MCP Hub] UI client connected');
    const transport = new ExtensionServerTransport(port);
    try {
      await this.server.connect(transport);
    } catch (error) {
      console.error('[MCP Hub] Error connecting UI transport:', error);
    }
  }

  private handleContentScriptConnection(port: chrome.runtime.Port) {
    const domain = this.domainToolManager.extractDomainFromUrl(port.sender?.tab?.url || '');
    if (!domain) {
      console.error('[MCP Hub] Content script connection missing tab ID');
      return;
    }

    console.log(`[MCP Hub] Content script connected from tab ${domain}`);

    port.onMessage.addListener(async (message) => {
      if (message.type === 'register-tools' && message.tools) {
        await this.registerTabTools(domain, port, message.tools);
      } else if (message.type === 'tools-updated' && message.tools) {
        await this.updateTabTools(domain, port, message.tools);
      } else if (message.type === 'tool-result' && message.requestId) {
        this.requestManager.resolve(message.requestId, message.data);
      }
    });

    port.onDisconnect.addListener(async () => {
      console.log(`[MCP Hub] Tab ${domain} disconnected`);
      await this.domainToolManager.unregisterTab(domain);

      // Only unregister non-cached tools when tab disconnects
      const domainTools = this.domainToolManager.getToolsForDomain(domain);
      const nonCachedTools = domainTools.filter((tool) => tool.annotations?.cache !== true);

      if (nonCachedTools.length > 0) {
        this.unregisterWebsiteTools(domain, nonCachedTools);
      }
    });
  }

  private async registerTabTools(domain: string, port: chrome.runtime.Port, tools: Tool[]) {
    console.log(`[MCP Hub] Registering ${tools.length} tools from tab ${domain}`);

    // Register tools with domain manager
    await this.domainToolManager.registerTools(domain, port, tools);

    // First unregister ALL existing website tools for this domain to avoid duplicates
    const existingTools = this.domainToolManager.getToolsForDomain(domain);
    if (existingTools.length > 0) {
      this.unregisterWebsiteTools(domain, existingTools);
    }

    // Register each tool with website prefix
    for (const tool of tools) {
      this.registerWebsiteTool(domain, tool);
    }

    // Refresh descriptions for all tools in this domain to update tab counts
    setTimeout(() => this.refreshDomainToolDescriptions(domain), 100);
  }

  private async updateTabTools(domain: string, port: chrome.runtime.Port, tools: Tool[]) {
    console.log(`[MCP Hub] Updating ${tools.length} tools from tab ${domain}`);

    // Get current tools for this domain
    const currentTools = this.domainToolManager.getToolsForDomain(domain);
    const currentToolNames = new Set(currentTools.map((t) => t.name));
    const newToolNames = new Set(tools.map((t) => t.name));

    // Find tools to remove (in current but not in new)
    const toolsToRemove = currentTools.filter((tool) => !newToolNames.has(tool.name));

    // Find tools to add (in new but not in current)
    const toolsToAdd = tools.filter((tool) => !currentToolNames.has(tool.name));

    // Find tools to update (in both but might have changed)
    const toolsToUpdate = tools.filter((tool) => currentToolNames.has(tool.name));
    // Update domain manager with new tools
    await this.domainToolManager.registerTools(domain, port, tools);

    // Remove old tools (only remove non-cached tools or if the new tool list doesn't have cache=true)
    if (toolsToRemove.length > 0) {
      const toolsToActuallyRemove = toolsToRemove.filter((tool) => {
        // Always remove non-cached tools when they're not in the new list
        if (tool.annotations?.cache !== true) return true;
        // For cached tools, only remove if they're not in the new list
        return !tools.some(
          (newTool) => newTool.name === tool.name && newTool.annotations?.cache === true
        );
      });

      if (toolsToActuallyRemove.length > 0) {
        this.unregisterWebsiteTools(domain, toolsToActuallyRemove);
      }
    }

    // Add new tools
    for (const tool of toolsToAdd) {
      this.registerWebsiteTool(domain, tool);
    }

    // Update existing tools (description might have changed)
    for (const tool of toolsToUpdate) {
      const cleanedDomain = sanitizeToolName(domain);
      const toolName = `website_tool_${cleanedDomain}_${sanitizeToolName(tool.name)}`;
      const mcpTool = this.registeredTools.get(toolName);

      if (mcpTool) {
        const description = await this.domainToolManager.getDomainDescription(
          domain,
          tool.description
        );
        try {
          mcpTool.update({
            paramsSchema: mcpTool.inputSchema?.shape,
            description,
          });
        } catch (error) {
          console.warn(`[MCP Hub] Failed to update tool ${toolName}:`, error);
        }
      }
    }
  }

  private async registerWebsiteTool(domain: string, tool: Tool) {
    const cleanedDomain = sanitizeToolName(domain);
    const toolName = `website_tool_${cleanedDomain}_${sanitizeToolName(tool.name)}`;
    console.log('toolName', toolName);
    // Build description with domain information
    const description = await this.domainToolManager.getDomainDescription(domain, tool.description);

    // Create a simple schema that accepts any object
    const obj: Record<string, z.ZodAny> = {};
    for (const key of Object.keys(tool.inputSchema.properties ?? {})) {
      obj[key] = z.any();
    }

    try {
      const mcpTool = this.server.registerTool(
        toolName,
        {
          description,
          inputSchema: obj,
        },
        async (args: any) => {
          return this.executeWebsiteTool(domain, tool.name, args);
        }
      );

      this.registeredTools.set(toolName, mcpTool);
    } catch (error) {
      console.error(`[MCP Hub] Failed to register tool ${toolName}:`, error);
    }
  }

  private async executeWebsiteTool(
    domain: string,
    originalToolName: string,
    args: any
  ): Promise<CallToolResult> {
    console.log('executeWebsiteTool', domain, originalToolName, args);

    // Get or create a tab for this domain
    const tabId = await this.domainToolManager.getOrCreateTabForDomain(domain);

    // Navigate to the tab to make it active
    await this.domainToolManager.navigateToTab(tabId);

    // Get the tab connection
    const tabConnection = this.domainToolManager.getTabConnection(tabId);
    if (!tabConnection) {
      // If no connection exists yet, wait a bit for the content script to connect
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Try again
      const retryConnection = this.domainToolManager.getTabConnection(tabId);
      if (!retryConnection) {
        throw new Error(
          `No connection established for tab ${tabId}. The page may not have loaded the MCP tools yet.`
        );
      }
      return this.executeWebsiteTool(domain, originalToolName, args);
    }

    try {
      console.log(
        `[MCP Hub] Executing tool ${originalToolName} on domain ${domain} via tab ${tabId}`
      );

      const result = await this.requestManager.create(tabConnection.port, {
        type: 'execute-tool',
        toolName: originalToolName,
        args,
      });
      return result as CallToolResult;
    } catch (error) {
      throw new Error(`Failed to execute tool: ${error}`);
    }
  }

  private async reregisterToolsForActiveTab(activeTabId: number) {
    try {
      // Get the domain for the active tab
      const tab = await chrome.tabs.get(activeTabId);
      if (!tab.url) return;

      const domain = this.domainToolManager.extractDomainFromUrl(tab.url);
      const domainData = this.domainToolManager.getAllDomainTools().get(domain);

      if (domainData) {
        console.log(`[MCP Hub] Re-registering tools for active domain ${domain}`);

        // Re-register all tools for this domain (both cached and non-cached)
        for (const tool of domainData.tools) {
          const cleanedDomain = sanitizeToolName(domain);
          const toolName = `website_tool_${cleanedDomain}_${sanitizeToolName(tool.name)}`;

          // Only register if not already registered
          if (!this.registeredTools.has(toolName)) {
            this.registerWebsiteTool(domain, tool);
          }
        }
      }
    } catch (error) {
      console.error(`[MCP Hub] Error re-registering tools for active tab:`, error);
    }
  }

  private async unregisterNonCachedToolsFromInactiveTabs(activeTabId: number) {
    console.log(
      `[MCP Hub] Unregistering non-cached tools from inactive tabs (active: ${activeTabId})`
    );

    // Get all domain tools and check which tabs are inactive
    const allDomainTools = this.domainToolManager.getAllDomainTools();

    for (const [domain, domainData] of allDomainTools) {
      // Check if this domain has any tabs that are currently inactive
      const isTabActive = await this.isDomainTabActive(domain, activeTabId);

      if (!isTabActive) {
        console.log('domainData', domainData);
        // Unregister non-cached tools from this domain
        const nonCachedTools = domainData.tools.filter((tool) => tool.annotations?.cache !== true);

        if (nonCachedTools.length > 0) {
          console.log(
            `[MCP Hub] Unregistering ${nonCachedTools.length} non-cached tools from inactive domain ${domain}`
          );
          this.unregisterWebsiteTools(domain, nonCachedTools);
        }
      }
    }
  }

  private async isDomainTabActive(domain: string, activeTabId: number): Promise<boolean> {
    try {
      // Get all tabs for this domain
      const tabs = await chrome.tabs.query({});
      const domainTabs = tabs.filter((tab) => {
        if (!tab.url || !tab.id) return false;
        const tabDomain = this.domainToolManager.extractDomainFromUrl(tab.url);
        return tabDomain === domain;
      });

      console.log(`[MCP Hub] Checking domain ${domain} against active tab ${activeTabId}:`, {
        domainTabs: domainTabs.map((t) => ({ id: t.id, url: t.url })),
        activeTabId,
        hasActiveTab: domainTabs.some((tab) => tab.id === activeTabId),
      });

      // Check if any of the domain's tabs is the active tab
      return domainTabs.some((tab) => tab.id === activeTabId);
    } catch (error) {
      console.error(`[MCP Hub] Error checking if domain ${domain} is active:`, error);
      return false;
    }
  }

  private unregisterWebsiteTools(domain: string, tools: Tool[]) {
    // Remove all website tools that match the given tool names
    const toolsToRemove: string[] = [];
    const cleanedDomain = sanitizeToolName(domain);

    for (const tool of tools) {
      const toolName = `website_tool_${cleanedDomain}_${sanitizeToolName(tool.name)}`;
      if (this.registeredTools.has(toolName)) {
        toolsToRemove.push(toolName);
      }
    }

    for (const toolName of toolsToRemove) {
      const mcpTool = this.registeredTools.get(toolName);
      if (mcpTool) {
        try {
          mcpTool.remove();
          this.registeredTools.delete(toolName);
          console.log(`[MCP Hub] Successfully removed tool ${toolName}`);
        } catch (error) {
          console.warn(`[MCP Hub] Failed to remove tool ${toolName}:`, error);
        }
      }
    }
  }

  /**
   * Cleanup method to properly close connections
   */
  async cleanup(): Promise<void> {
    if (this.bridgeServerTransport) {
      try {
        await this.bridgeServerTransport.close();
        console.log('[MCP Hub] Bridge transport closed');
      } catch (error) {
        console.error('[MCP Hub] Error closing bridge transport:', error);
      }
    }
  }
}
