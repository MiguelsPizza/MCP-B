import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface TabInfo {
  port: chrome.runtime.Port;
  tools: Tool[];
  url?: string;
  domain: string;
  timestamp: number;
  domainIndex: number;
  isActive: boolean;
}

export class TabManager {
  public tabs = new Map<number, TabInfo>();
  public domainCounters = new Map<string, Set<number>>();
  public activeTabId: number | null = null;

  register(tabId: number, port: chrome.runtime.Port, tools: Tool[]): TabInfo {
    const domain = this.extractDomain(port.sender?.tab?.url);
    const domainIndex = this.getNextDomainIndex(domain);

    const info: TabInfo = {
      port,
      tools,
      url: port.sender?.tab?.url,
      domain,
      timestamp: Date.now(),
      domainIndex,
      isActive: tabId === this.activeTabId,
    };

    this.tabs.set(tabId, info);

    // Track domain usage
    if (!this.domainCounters.has(domain)) {
      this.domainCounters.set(domain, new Set());
    }
    this.domainCounters.get(domain)!.add(domainIndex);

    return info;
  }

  unregister(tabId: number): void {
    const info = this.tabs.get(tabId);
    if (info) {
      // Clean up domain index
      this.domainCounters.get(info.domain)?.delete(info.domainIndex);
      this.tabs.delete(tabId);
    }
  }

  setActiveTab(tabId: number | null): void {
    this.activeTabId = tabId;
    for (const [id, info] of this.tabs) {
      info.isActive = id === tabId;
    }
  }

  getTabInfo(tabId: number): TabInfo | undefined {
    return this.tabs.get(tabId);
  }

  getAllTabs(): Map<number, TabInfo> {
    return new Map(this.tabs);
  }

  getTabsByDomain(domain: string): TabInfo[] {
    return Array.from(this.tabs.values()).filter((info) => info.domain === domain);
  }

  private extractDomain(url?: string): string {
    if (!url) return 'unknown';
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown';
    }
  }

  private getNextDomainIndex(domain: string): number {
    const used = this.domainCounters.get(domain) || new Set();
    let index = 1;
    while (used.has(index)) index++;
    return index;
  }
}
