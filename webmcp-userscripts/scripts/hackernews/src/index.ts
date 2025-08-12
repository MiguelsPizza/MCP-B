/// <reference types="vite-plugin-monkey/client" />

import { TabServerTransport } from '@mcp-b/transports';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

type HackerNewsPost = {
  position: number;
  id: string | null;
  title: string;
  url: string;
  site?: string | null;
  score?: number | null;
  commentsCount?: number | null;
  author?: string | null;
  age?: string | null;
};

function log(level: 'info' | 'warn' | 'error', message: string, ...args: unknown[]): void {
  // eslint-disable-next-line no-console
  console.log(`[HN MCP Server] ${level}: ${message}`, ...args);
}

class HackerNewsMcpServer {
  private server: McpServer;
  private transport: TabServerTransport;
  private initialized = false;

  constructor() {
    this.server = new McpServer(
      { name: 'Hacker News MCP Server', version: '1.0.0' },
      {
        capabilities: { tools: { listChanged: true } },
        instructions: 'Tools for reading Hacker News front page posts and clicking into a post.',
      }
    );

    // Simple utility tool
    this.server.registerTool(
      'hn_get_page_title',
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
    return {
      content: [
        {
          type: 'text' as const,
          text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  private formatError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text' as const, text: `Error: ${message}` }],
      isError: true as const,
    };
  }

  private parseFrontPage(maxResults: number = 30): HackerNewsPost[] {
    const rows = Array.from(document.querySelectorAll('tr.athing')) as HTMLTableRowElement[];
    const posts: HackerNewsPost[] = [];

    let position = 0;
    for (const row of rows) {
      const id = row.getAttribute('id');
      const titleAnchor = (row.querySelector('.titleline a') ||
        row.querySelector('a.storylink')) as HTMLAnchorElement | null;
      if (!titleAnchor) continue;

      const siteEl = row.querySelector('.sitestr') as HTMLElement | null;
      const subtextRow = row.nextElementSibling as HTMLTableRowElement | null; // subtext is in the next row
      const subtext = subtextRow?.querySelector('.subtext') as HTMLElement | null;
      const scoreText = subtext?.querySelector('.score')?.textContent || null;
      const score = scoreText ? Number.parseInt(scoreText, 10) : null;

      const commentAnchorCandidates = subtext
        ? (Array.from(subtext.querySelectorAll('a')) as HTMLAnchorElement[])
        : [];
      const commentsAnchor =
        commentAnchorCandidates.reverse().find(a => /comment/i.test(a.textContent || '')) || null;
      let commentsCount: number | null = null;
      if (commentsAnchor) {
        const match = (commentsAnchor.textContent || '').match(/(\d+)\s+comment/);
        commentsCount = match ? Number.parseInt(match[1], 10) : 0;
      }

      const author = subtext?.querySelector('.hnuser')?.textContent || null;
      const age = subtext?.querySelector('.age')?.textContent || null;

      position += 1;
      posts.push({
        position,
        id: id || null,
        title: titleAnchor.textContent?.trim() || titleAnchor.title || titleAnchor.href,
        url: titleAnchor.href,
        site: siteEl?.textContent?.trim() || null,
        score,
        commentsCount,
        author,
        age,
      });

      if (posts.length >= maxResults) break;
    }

    return posts;
  }

  private async init(): Promise<void> {
    try {
      await this.server.connect(this.transport);

      this.server.registerTool(
        'hn_get_posts',
        {
          title: 'HN Get Posts',
          description:
            'Read Hacker News front-page posts (title, url, id, site, score, commentsCount, author, age)',
          inputSchema: {
            maxResults: z
              .number()
              .int()
              .min(1)
              .max(100)
              .optional()
              .describe('Maximum number of posts to return (default 30)'),
          },
          annotations: { readOnlyHint: true, idempotentHint: true },
        },
        async ({ maxResults }: { maxResults?: number }) => {
          try {
            const posts = this.parseFrontPage(maxResults ?? 30);
            return this.format({ posts, count: posts.length, href: window.location.href });
          } catch (e) {
            return this.formatError(e);
          }
        }
      );

      this.server.registerTool(
        'hn_click_post',
        {
          title: 'HN Click Post',
          description:
            'Click/navigate into a Hacker News post by index (1-based), id, or matching title text',
          inputSchema: {
            index: z
              .number()
              .int()
              .min(1)
              .optional()
              .describe('1-based index of the post on the page'),
            id: z.string().optional().describe('The post id (tr.athing id)'),
            titleIncludes: z
              .string()
              .optional()
              .describe('Case-insensitive substring to match post title'),
          },
          annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: true },
        },
        async ({
          index,
          id,
          titleIncludes,
        }: {
          index?: number;
          id?: string;
          titleIncludes?: string;
        }) => {
          try {
            let anchor: HTMLAnchorElement | null = null;

            if (id) {
              const row = document.querySelector(`tr.athing[id="${CSS.escape(id)}"]`);
              anchor = (row?.querySelector('.titleline a') ||
                row?.querySelector('a.storylink')) as HTMLAnchorElement | null;
            }

            if (!anchor && typeof index === 'number') {
              const rows = Array.from(
                document.querySelectorAll('tr.athing')
              ) as HTMLTableRowElement[];
              const row = rows[index - 1];
              if (row) {
                anchor = (row.querySelector('.titleline a') ||
                  row.querySelector('a.storylink')) as HTMLAnchorElement | null;
              }
            }

            if (!anchor && titleIncludes) {
              const allAnchors = Array.from(
                document.querySelectorAll('tr.athing .titleline a, tr.athing a.storylink')
              ) as HTMLAnchorElement[];
              const needle = titleIncludes.toLowerCase();
              anchor =
                allAnchors.find(a => (a.textContent || '').toLowerCase().includes(needle)) || null;
            }

            if (!anchor) {
              return this.formatError(
                'Could not find a matching post. Provide id, index, or titleIncludes.'
              );
            }

            const href = anchor.href;
            anchor.click();
            // Fallback navigation in case click is blocked
            if (href) {
              setTimeout(() => {
                if (location.href === href) return;
                try {
                  window.location.href = href;
                } catch {
                  // ignore
                }
              }, 100);
            }

            return this.format({ navigated: true, href });
          } catch (e) {
            return this.formatError(e);
          }
        }
      );

      this.initialized = true;
      log('info', 'Hacker News MCP Server initialized');
    } catch (e) {
      log('error', 'Failed to initialize Hacker News MCP Server', e);
    }
  }

  public isInitialized(): boolean {
    return this.initialized;
  }
}

let hnServer: HackerNewsMcpServer | null = null;

async function ensureServer() {
  if (!hnServer) {
    hnServer = new HackerNewsMcpServer();
    (window as any).hnMcpServer = hnServer;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void ensureServer());
} else {
  void ensureServer();
}

// Observe for navigation changes (HN is not SPA, but be resilient to extensions)
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

log('info', 'Hacker News MCP Server script loaded');
