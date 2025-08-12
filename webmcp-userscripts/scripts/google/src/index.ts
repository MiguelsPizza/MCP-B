/// <reference types="vite-plugin-monkey/client" />

import { TabServerTransport } from '@mcp-b/transports';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

function log(level: 'info' | 'warn' | 'error', message: string, ...args: unknown[]): void {
  // Keep logs minimal to avoid noisy console
  // eslint-disable-next-line no-console
  console.log(`[Google MCP Server] ${level}: ${message}`, ...args);
}

class GoogleMcpServer {
  private server: McpServer;
  private transport: TabServerTransport;
  private initialized = false;

  constructor() {
    this.server = new McpServer(
      { name: 'Google MCP Server', version: '1.0.0' },
      {
        capabilities: {
          tools: { listChanged: true },
        },
        instructions:
          'Google.com tools: read page title, extract search query, read search results, and navigate paginated results.'
      }
    );

    this.server.registerTool(
      'get_page_title',
      {
        title: 'Get Page Title',
        description: 'Return document.title',
        inputSchema: {},
      },
      async () => this.format(document.title)
    );

    this.transport = new TabServerTransport({ allowedOrigins: ['*'] });
    void this.init();
  }

  private format(data: unknown) {
    return { content: [{ type: 'text' as const, text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }] };
  }

  private formatError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { content: [{ type: 'text' as const, text: `Error: ${message}` }], isError: true as const };
  }

  private getSearchQuery(): string | null {
    const input = document.querySelector('textarea[name="q"], input[name="q"]') as
      | HTMLInputElement
      | HTMLTextAreaElement
      | null;
    const fromInput = input?.value?.trim();
    const fromUrl = new URLSearchParams(window.location.search).get('q') || '';
    return (fromInput || fromUrl || '').trim() || null;
  }

  private getCurrentStartParam(): number {
    const startParam = new URLSearchParams(window.location.search).get('start');
    const start = startParam ? Number.parseInt(startParam, 10) : 0;
    return Number.isFinite(start) && start >= 0 ? start : 0;
  }

  private buildResultsUrl(query: string, start: number): string {
    const url = new URL(window.location.href);
    url.pathname = '/search';
    const params = url.searchParams;
    params.set('q', query);
    if (start > 0) {
      params.set('start', String(start));
    } else {
      params.delete('start');
    }
    url.search = params.toString();
    return url.toString();
  }

  private parseSearchResults(maxResults: number = 10): Array<{
    position: number;
    title: string;
    url: string;
    displayedUrl?: string | null;
    snippet?: string | null;
  }> {
    const results: Array<{
      position: number;
      title: string;
      url: string;
      displayedUrl?: string | null;
      snippet?: string | null;
    }> = [];

    // Heuristic: organic results typically have an anchor with an <h3> inside under #search
    const h3Nodes = Array.from(document.querySelectorAll('div#search a h3')) as HTMLHeadingElement[];
    let index = 0;
    for (const h3 of h3Nodes) {
      const anchor = h3.closest('a') as HTMLAnchorElement | null;
      if (!anchor || !anchor.href) continue;

      // Try to scope to visible organic blocks only
      const container = anchor.closest('div.g, div.MjjYud, div') as HTMLElement | null;
      const title = h3.textContent?.trim() || anchor.title || anchor.href;

      // Snippet selectors vary; try several common ones
      const snippetEl =
        container?.querySelector(
          'div[data-sncf], div[data-snf], div.VwiC3b, div.ylHkof, div.BNeawe, div[data-content-feature="1"]'
        ) || container?.querySelector('span.aCOpRe');
      const snippet = snippetEl?.textContent?.trim() || null;

      // Displayed URL (sometimes inside cite or span)
      const displayedUrlEl =
        container?.querySelector('span.TPc9gc, cite, div.BTtC6e, span.VuuXrf') || anchor.querySelector('cite');
      const displayedUrl = displayedUrlEl?.textContent?.trim() || null;

      index += 1;
      results.push({ position: index, title: title || 'Untitled result', url: anchor.href, displayedUrl, snippet });
      if (results.length >= maxResults) break;
    }

    return results;
  }

  private async init(): Promise<void> {
    try {
      await this.server.connect(this.transport);

      // Core utilities (additional tools; one tool is already registered pre-connect)

      this.server.registerTool(
        'extract_search_query',
        {
          title: 'Extract Search Query',
          description: 'Read the current Google search query from the search box or URL parameter q',
          inputSchema: {},
          annotations: { readOnlyHint: true, idempotentHint: true }
        },
        async () => {
          try {
            const fromInputOrUrl = this.getSearchQuery();
            const fromUrl = new URLSearchParams(window.location.search).get('q') || '';
            return this.format({ fromInput: fromInputOrUrl || null, fromUrl: fromUrl || null });
          } catch (e) {
            return this.formatError(e);
          }
        }
      );

      this.server.registerTool(
        'run_search',
        {
          title: 'Run Search',
          description: 'Navigate to a Google results page for the provided query',
          inputSchema: { query: z.string().min(1).describe('Search terms') },
          annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: true }
        },
        async ({ query }: { query: string }) => {
          try {
            const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
            window.location.href = url;
            return this.format({ navigated: true, url });
          } catch (e) {
            return this.formatError(e);
          }
        }
      );

      // Read organic search results
      this.server.registerTool(
        'get_search_results',
        {
          title: 'Get Search Results',
          description: 'Return a list of organic search results (title, url, snippet, displayedUrl)',
          inputSchema: {
            maxResults: z
              .number()
              .int()
              .min(1)
              .max(50)
              .optional()
              .describe('Maximum number of results to return (default 10)'),
          },
          annotations: { readOnlyHint: true, idempotentHint: true },
        },
        async ({ maxResults }: { maxResults?: number }) => {
          try {
            const query = this.getSearchQuery();
            if (!query) {
              return this.formatError('No search query detected. Navigate to a results page first.');
            }
            const results = this.parseSearchResults(maxResults ?? 10);
            return this.format({ query, results });
          } catch (e) {
            return this.formatError(e);
          }
        }
      );

      // Pagination info
      this.server.registerTool(
        'get_pagination_info',
        {
          title: 'Get Pagination Info',
          description: 'Return current page number and whether next/previous pages exist',
          inputSchema: {},
          annotations: { readOnlyHint: true, idempotentHint: true },
        },
        async () => {
          try {
            const query = this.getSearchQuery();
            if (!query) return this.formatError('No search query detected.');
            const start = this.getCurrentStartParam();
            const page = Math.floor(start / 10) + 1;
            const hasNext = Boolean(document.querySelector('#pnnext')) || true; // assume there is a next page for most queries
            const hasPrev = Boolean(document.querySelector('#pnprev')) || start > 0;
            // Try reading result stats if present
            const statsText = document.querySelector('#result-stats')?.textContent?.trim() || null;
            return this.format({ query, page, hasNext, hasPrev, statsText });
          } catch (e) {
            return this.formatError(e);
          }
        }
      );

      // Navigate to a specific results page number (1-based)
      this.server.registerTool(
        'go_to_results_page',
        {
          title: 'Go To Results Page',
          description: 'Navigate to a specific results page number (1-based)',
          inputSchema: { page: z.number().int().min(1).describe('Results page number, starting at 1') },
          annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: true },
        },
        async ({ page }: { page: number }) => {
          try {
            const query = this.getSearchQuery();
            if (!query) return this.formatError('No search query detected.');
            const start = (page - 1) * 10;
            const url = this.buildResultsUrl(query, start);
            window.location.href = url;
            return this.format({ navigated: true, page, url });
          } catch (e) {
            return this.formatError(e);
          }
        }
      );

      // Next page
      this.server.registerTool(
        'next_results_page',
        {
          title: 'Next Results Page',
          description: 'Navigate to the next page of Google results',
          inputSchema: {},
          annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: true },
        },
        async () => {
          try {
            const query = this.getSearchQuery();
            if (!query) return this.formatError('No search query detected.');
            const start = this.getCurrentStartParam();
            const nextStart = start + 10;
            const url = this.buildResultsUrl(query, nextStart);
            window.location.href = url;
            return this.format({ navigated: true, page: Math.floor(nextStart / 10) + 1, url });
          } catch (e) {
            return this.formatError(e);
          }
        }
      );

      // Previous page
      this.server.registerTool(
        'previous_results_page',
        {
          title: 'Previous Results Page',
          description: 'Navigate to the previous page of Google results',
          inputSchema: {},
          annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: true },
        },
        async () => {
          try {
            const query = this.getSearchQuery();
            if (!query) return this.formatError('No search query detected.');
            const start = this.getCurrentStartParam();
            const prevStart = Math.max(0, start - 10);
            const url = this.buildResultsUrl(query, prevStart);
            window.location.href = url;
            return this.format({ navigated: true, page: Math.floor(prevStart / 10) + 1, url });
          } catch (e) {
            return this.formatError(e);
          }
        }
      );

      this.initialized = true;
      log('info', 'Google MCP Server initialized');
    } catch (e) {
      log('error', 'Failed to initialize Google MCP Server', e);
    }
  }

  public isInitialized(): boolean {
    return this.initialized;
  }
}

let googleServer: GoogleMcpServer | null = null;

async function ensureServer() {
  if (!googleServer) {
    googleServer = new GoogleMcpServer();
    (window as any).googleMcpServer = googleServer;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void ensureServer());
} else {
  void ensureServer();
}

// SPA-like navigation observer (for results updates)
let lastHref = location.href;
const observer = new MutationObserver(() => {
  if (location.href !== lastHref) {
    lastHref = location.href;
    setTimeout(() => void ensureServer(), 500);
  }
});
observer.observe(document.documentElement, { childList: true, subtree: true });

window.addEventListener('beforeunload', () => {
  // placeholder for cleanup if needed later
});

log('info', 'Google MCP Server script loaded');


