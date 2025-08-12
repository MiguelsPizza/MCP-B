/// <reference types="vite-plugin-monkey/client" />

import { z } from 'zod';
import {
  initializeMCPGlobal,
  waitForElement,
  safelyManipulateDOM,
  log,
  type MCPTool,
} from '@webmcp-userscripts';

/**
 * Template for creating new Tampermonkey MCP-B injection scripts
 *
 * Instructions:
 * 1. Replace SITE_NAME with your target site name
 * 2. Update SITE_SELECTORS with your site's DOM selectors
 * 3. Implement your MCP tools in the registerTools method
 * 4. Update the site detection logic in waitForSiteReady
 */

// Site-specific selectors - UPDATE THESE FOR YOUR SITE
const SITE_SELECTORS = {
  // Example selectors - replace with your site's actual selectors
  mainContainer: '[role="main"]',
  actionButton: '.action-button',
  contentArea: '.content',
  // Add more selectors as needed
} as const;

/**
 * SITE_NAME MCP-B Tool Implementation
 */
class SiteMCPTools {
  private initialized = false;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    try {
      log('info', 'Initializing SITE_NAME MCP-B tools...');

      // Initialize MCP-B global interface
      initializeMCPGlobal();

      // Wait for site to load
      await this.waitForSiteReady();

      // Register tools
      this.registerTools();

      this.initialized = true;
      log('info', 'SITE_NAME MCP-B tools initialized successfully');
    } catch (error) {
      log('error', 'Failed to initialize SITE_NAME MCP-B tools:', error);
    }
  }

  private async waitForSiteReady(): Promise<void> {
    // Wait for your site's main interface to load
    await waitForElement(SITE_SELECTORS.mainContainer, 15000);
    log('info', 'SITE_NAME interface detected');
  }

  private registerTools(): void {
    // Example tool 1 - UPDATE WITH YOUR TOOLS
    window.mcp!.registerTool({
      name: 'example_action',
      description: 'Perform an example action on SITE_NAME',
      inputSchema: z.object({
        message: z.string().min(1),
        options: z
          .object({
            param1: z.string().optional(),
            param2: z.boolean().default(false),
          })
          .optional(),
      }),
      handler: this.performExampleAction.bind(this),
    });

    // Example tool 2 - UPDATE WITH YOUR TOOLS
    window.mcp!.registerTool({
      name: 'get_site_info',
      description: 'Get information from SITE_NAME',
      inputSchema: z.object({
        includeDetails: z.boolean().default(true),
      }),
      handler: this.getSiteInfo.bind(this),
    });

    // Add more tools as needed
  }

  /**
   * Example tool implementation - UPDATE WITH YOUR LOGIC
   */
  private async performExampleAction(params: {
    message: string;
    options?: {
      param1?: string;
      param2?: boolean;
    };
  }): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      log('info', 'Performing example action:', params);

      // Example: Find and interact with DOM elements
      const actionButton = await waitForElement(SITE_SELECTORS.actionButton);

      // Example: Safe DOM manipulation
      const result = safelyManipulateDOM(() => {
        // Your DOM manipulation logic here
        actionButton.click();
        return { clicked: true };
      });

      log('info', 'Example action completed successfully');

      return {
        success: true,
        message: 'Action completed successfully',
        data: result,
      };
    } catch (error) {
      log('error', 'Failed to perform example action:', error);
      return {
        success: false,
        message: `Failed to perform action: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Example info retrieval tool - UPDATE WITH YOUR LOGIC
   */
  private async getSiteInfo(params: { includeDetails: boolean }): Promise<{
    siteName: string;
    url: string;
    title: string;
    details?: any;
  }> {
    try {
      log('info', 'Getting site info:', params);

      const info = {
        siteName: 'SITE_NAME',
        url: window.location.href,
        title: document.title,
      };

      if (params.includeDetails) {
        // Add more detailed information
        const details = safelyManipulateDOM(() => {
          // Extract additional site-specific information
          const contentArea = document.querySelector(SITE_SELECTORS.contentArea);
          return {
            hasContent: !!contentArea,
            contentLength: contentArea?.textContent?.length || 0,
            // Add more details as needed
          };
        });

        return { ...info, details };
      }

      return info;
    } catch (error) {
      log('error', 'Failed to get site info:', error);
      return {
        siteName: 'SITE_NAME',
        url: window.location.href,
        title: document.title,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  // Add more tool implementations here
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new SiteMCPTools());
} else {
  new SiteMCPTools();
}

// Handle navigation for single-page applications
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    // Re-initialize on navigation
    setTimeout(() => new SiteMCPTools(), 1000);
  }
}).observe(document, { subtree: true, childList: true });

log('info', 'SITE_NAME MCP-B injector script loaded');
