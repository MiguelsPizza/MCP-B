import type { TabManager } from './TabManager';

export class ToolDescriptionBuilder {
  constructor(private tabManager: TabManager) {}

  buildDescription(tabId: number): string {
    const info = this.tabManager.getTabInfo(tabId);
    if (!info) return '';

    const sameDomainTabs = this.tabManager.getTabsByDomain(info.domain);

    if (sameDomainTabs.length === 1) {
      return `[${info.domain}${info.isActive ? ' • Active' : ''}]`;
    }

    const activeTab = sameDomainTabs.find((tab) => tab.isActive);
    const activeIndicator = activeTab ? ` • Tab ${activeTab.domainIndex} Active` : '';

    return `[${info.domain} - ${sameDomainTabs.length} tabs${activeIndicator}]`;
  }

  getToolPrefix(tabId: number): string {
    return `tab${tabId}_`;
  }
}
