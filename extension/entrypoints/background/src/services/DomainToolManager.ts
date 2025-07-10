import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { parseToolInfo } from '@/entrypoints/sidepanel/components/McpServer/utils';

export interface DomainTools {
  domain: string;
  tools: Tool[];
  lastUpdated: number;
}

export interface TabConnection {
  tabId: number;
  port: chrome.runtime.Port;
  domain: string;
}

export class DomainToolManager {
  private domainTools = new Map<string, DomainTools>();
  private storageKey = 'mcp_domain_tools';
  private activeTabId: number | null = null;
  private tabConnections = new Map<number, TabConnection>();

  constructor() {
    this.loadFromStorage();
    this.trackActiveTab();
  }

  async registerTools(domain: string, port: chrome.runtime.Port, tools: Tool[]): Promise<void> {
    // Store tab connection
    const tabId = port.sender?.tab?.id;
    if (tabId) {
      this.tabConnections.set(tabId, {
        tabId,
        port,
        domain,
      });
    }

    // Update domain tools
    this.domainTools.set(domain, {
      domain,
      tools,
      lastUpdated: Date.now(),
    });

    // Persist to storage
    await this.saveToStorage();
  }

  async unregisterTab(domain: string): Promise<void> {
    // Remove tab connections for this domain
    for (const [tabId, connection] of this.tabConnections) {
      if (connection.domain === domain) {
        this.tabConnections.delete(tabId);
      }
    }
    // Note: We keep domain tools in storage even when tabs close
  }

  getToolsForDomain(domain: string): Tool[] {
    return this.domainTools.get(domain)?.tools || [];
  }

  getAllDomainTools(): Map<string, DomainTools> {
    return new Map(this.domainTools);
  }

  getTabConnection(tabId: number): TabConnection | undefined {
    return this.tabConnections.get(tabId);
  }

  async getOrCreateTabForDomain(domain: string): Promise<number> {
    // First, try to find an existing tab for this domain
    const tabs = await chrome.tabs.query({});
    const domainTabs = tabs.filter((tab) => {
      if (!tab.url || !tab.id) return false;
      const tabDomain = this.extractDomainFromUrl(tab.url);
      return tabDomain === domain;
    });

    if (domainTabs.length > 0 && domainTabs[0].id) {
      // Return the first existing tab
      return domainTabs[0].id;
    }

    // No existing tab found, create a new one
    let url: string;

    // Handle localhost with port
    if (domain.startsWith('localhost:')) {
      url = `http://${domain}`;
    } else if (domain === 'localhost') {
      url = 'http://localhost';
    } else {
      // For regular domains, use https by default
      url = `https://${domain}`;
    }

    const newTab = await chrome.tabs.create({ url, active: true });

    if (!newTab.id) {
      throw new Error('Failed to create new tab');
    }

    // Wait a bit for the tab to load
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return newTab.id;
  }

  async navigateToTab(tabId: number): Promise<void> {
    await chrome.tabs.update(tabId, { active: true });
    // Wait a bit for tab to become active
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(this.storageKey);
      const stored = result[this.storageKey];

      if (stored && Array.isArray(stored)) {
        this.domainTools.clear();
        for (const domainData of stored) {
          this.domainTools.set(domainData.domain, domainData);
        }
      }
    } catch (error) {
      console.error('[DomainToolManager] Failed to load from storage:', error);
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      const data = Array.from(this.domainTools.values());
      await chrome.storage.local.set({ [this.storageKey]: data });
    } catch (error) {
      console.error('[DomainToolManager] Failed to save to storage:', error);
    }
  }

  private trackActiveTab(): void {
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.activeTabId = activeInfo.tabId;
    });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        this.activeTabId = tabs[0].id;
      }
    });
  }

  isTabActive(tabId: number): boolean {
    return tabId === this.activeTabId;
  }

  async getDomainDescription(domain: string, originalDescription?: string): Promise<string> {
    try {
      // Query all tabs to find ones with this domain
      const tabs = await chrome.tabs.query({});
      const domainTabs = tabs.filter((tab) => {
        if (!tab.url || !tab.id) return false;
        const tabDomain = this.extractDomainFromUrl(tab.url);
        return tabDomain === domain;
      });

      let prefix = `[${domain}`;

      if (domainTabs.length === 0) {
        prefix += ']';
      } else if (domainTabs.length === 1) {
        if (domainTabs[0].id && this.isTabActive(domainTabs[0].id)) {
          prefix += ' • Active]';
        } else {
          prefix += ']';
        }
      } else {
        prefix += ` - ${domainTabs.length} tabs`;
        const activeTabIndex = domainTabs.findIndex((tab) => tab.id && this.isTabActive(tab.id));
        if (activeTabIndex !== -1) {
          prefix += ` • Tab ${activeTabIndex + 1} Active`;
        }
        prefix += ']';
      }

      return `${prefix} ${originalDescription || ''}`;
    } catch (error) {
      console.error('[DomainToolManager] Error getting domain description:', error);
      return `[${domain}] ${originalDescription || ''}`;
    }
  }

  /**
   * Extract domain from URL
   */
  extractDomainFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;

      // Special handling for localhost - include port for grouping
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') {
        return `localhost:${urlObj.port || '80'}`;
      }

      // For other domains, return just the hostname
      return hostname;
    } catch {
      // If URL parsing fails, return a default
      return 'unknown';
    }
  }
}
