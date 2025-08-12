// Tampermonkey Script Metadata
export interface UserScriptMetadata {
  name: string;
  namespace: string;
  version: string;
  description: string;
  author: string;
  match: string[];
  grant: string[];
  license?: string;
  homepageURL?: string;
  supportURL?: string;
  updateURL?: string;
  downloadURL?: string;
}
// Utility Types
export type DOMElement = Element | HTMLElement;
export type DOMSelector = string;

// Site-specific configuration
export interface SiteConfig {
  name: string;
  domains: string[];
  selectors: {
    [key: string]: DOMSelector;
  };
  initDelay?: number;
  retryCount?: number;
}
