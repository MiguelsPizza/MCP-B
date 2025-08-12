/// <reference types="vite-plugin-monkey/client" />

const log = (level: 'info' | 'warn' | 'error', message: string, ...args: any[]) => {
  console.log(`[Gmail MCP Server] ${level}: ${message}`, ...args);
};
import { TabServerTransport } from '@mcp-b/transports';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import 'gmail-js';
import $ from 'jquery';
import { z } from 'zod';

/**
 * Enhanced Gmail MCP Server Implementation using Gmail.js
 *
 * This server wraps Gmail.js functionality into context-aware tools following MCP-B best practices.
 * Tools are dynamically registered based on Gmail's current state and user permissions.
 * Implements state-aware tool registration, dynamic updates, and comprehensive Gmail operations.
 * Designed for AI agent use: Tools return structured data to build global state in LLM context.
 * Prefers programmatic Gmail.js APIs over DOM simulations for efficiency.
 */
class GmailMCPServer {
  private server: McpServer;
  private transport: TabServerTransport;
  private initialized = false;
  private gmail!: Gmail; // Gmail.js instance
  private currentPage = '';
  private isInEmail = false;
  private isComposing = false;
  private writeEnabled = true; // Enable writes by default
  private contextObservers = new Map<string, () => void>(); // Track Gmail observers
  private registeredTools = new Map<string, { enabled: boolean }>(); // Track registered tools with enable/disable state

  constructor() {
    this.server = new McpServer(
      {
        name: 'Gmail MCP Server Enhanced',
        version: '2.1.0',
      },
      {
        instructions:
          'Simplified Gmail integration server using Gmail.js API. Focuses on essential email operations: reading emails, listing inbox content, and composing new emails. All write operations are enabled by default. Tools return structured data for AI agent use.',
      }
    );

    this.server.registerTool(
      'ping',
      {
        title: 'Ping',
        description: 'Ping the server',
        inputSchema: {},
        annotations: {
          readOnlyHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async () => {
        return this.formatSuccess('Pong');
      }
    );

    this.transport = new TabServerTransport({
      allowedOrigins: ['*'],
    });
    this.init();
  }

  /**
   * Safely register a tool, avoiding duplicates and allowing disable/enable
   */
  private safeRegisterTool(
    name: string,
    definition: {
      title?: string;
      description?: string;
      inputSchema?: z.ZodRawShape | undefined;
      outputSchema?: z.ZodRawShape | undefined;
      annotations?: ToolAnnotations;
    },
    handler: (
      params?: any
    ) => Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }>,
    enabled = true
  ): void {
    if (!this.registeredTools.has(name)) {
      this.server.registerTool(name, definition, handler);
      this.registeredTools.set(name, { enabled });
    } else {
      // If exists, update enabled state
      this.registeredTools.set(name, { enabled });
      // MCP doesn't support disable, so re-register if needed (placeholder for future API support)
    }
  }

  /**
   * Disable a tool by name (since MCP can't remove, we track internally)
   */
  private disableTool(name: string): void {
    if (this.registeredTools.has(name)) {
      this.registeredTools.set(name, { enabled: false });
      // Future: If MCP supports disable, call it here
    }
  }

  /**
   * Format success response with structured data for AI state
   */
  private formatSuccess(data: unknown): { content: Array<{ type: 'text'; text: string }> } {
    return {
      content: [
        {
          type: 'text',
          text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  /**
   * Format error response
   */
  private formatError(error: unknown): {
    content: Array<{ type: 'text'; text: string }>;
    isError: boolean;
  } {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${message}`,
        },
      ],
      isError: true,
    };
  }

  private async init(): Promise<void> {
    try {
      log('info', 'Initializing Enhanced Gmail MCP Server with Gmail.js...');

      // Connect server to transport FIRST before registering any tools
      await this.server.connect(this.transport);

      // Make jQuery available globally for Gmail.js
      (window as any).$ = $;
      (window as any).jQuery = $;

      // Initialize Gmail.js
      // @ts-ignore: gmail-js has module resolution issues but works at runtime
      const GmailFactory = await import('gmail-js');
      this.gmail = new (GmailFactory as { Gmail: new () => Gmail }).Gmail();

      // Register core tools first (these don't depend on Gmail being loaded)

      // Set up load observer for when Gmail interface is ready
      this.gmail.observe.on('load', () => {
        log('info', 'Gmail.js loaded and interface ready');
        this.registerCoreTools();

        // Check for new data layer
        if (!this.gmail.check.is_new_data_layer()) {
          log('warn', 'Using old Gmail data layer; some tools may fail.');
        }

        // Initialize Gmail state tracking
        this.updateGmailState();

        // Register context-aware tools based on current state
        this.registerContextAwareTools();

        // Set up observers for dynamic tool updates
        this.setupGmailObservers();

        log('info', 'Enhanced Gmail MCP Server fully initialized');
        log(
          'info',
          `Current context: ${this.currentPage}, In email: ${this.isInEmail}, Composing: ${this.isComposing}`
        );
      });

      this.initialized = true;
      log('info', 'Enhanced Gmail MCP Server initialized successfully');
    } catch (error) {
      log('error', 'Failed to initialize Enhanced Gmail MCP Server:', error);
      throw error;
    }
  }

  /**
   * Update Gmail state for context-aware tool registration
   */
  private updateGmailState(): void {
    try {
      this.currentPage = this.gmail.get.current_page();
      this.isInEmail = this.gmail.check.is_inside_email();
      this.isComposing = this.gmail.dom.composes().length > 0;

      log(
        'info',
        `Gmail state updated - Page: ${this.currentPage}, In email: ${this.isInEmail}, Composing: ${this.isComposing}`
      );
    } catch (error) {
      log('error', 'Failed to update Gmail state:', error);
    }
  }

  /**
   * Register core tools that are always available
   */
  private registerCoreTools(): void {
    // Simple unread count tool (useful for context)
    this.safeRegisterTool(
      'get_unread_counts',
      {
        title: 'Get Unread Email Counts',
        description: 'Get unread email counts for Gmail inbox and main categories',
        inputSchema: {},
        annotations: {
          readOnlyHint: true,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async () => {
        try {
          const data = {
            total: this.gmail.get.unread_emails(),
            inbox: this.gmail.get.unread_inbox_emails(),
            drafts: this.gmail.get.unread_draft_emails(),
          };
          return this.formatSuccess(data);
        } catch (error) {
          return this.formatError(error);
        }
      }
    );

    // Navigation tools (always useful)
    this.safeRegisterTool(
      'navigate_to_page',
      {
        title: 'Navigate to Gmail Page',
        description:
          'Navigate to different Gmail pages/views like inbox, sent, drafts, etc. Updates state and tools.',
        inputSchema: {
          page: z
            .enum(['inbox', 'sent', 'drafts', 'starred', 'spam', 'trash', 'all', 'important'])
            .describe('Gmail page to navigate to'),
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async ({ page }: { page: string }) => {
        try {
          const pageUrls: Record<string, string> = {
            inbox: '#inbox',
            sent: '#sent',
            drafts: '#drafts',
            starred: '#starred',
            spam: '#spam',
            trash: '#trash',
            all: '#all',
            important: '#imp',
          };

          window.location.hash = pageUrls[page] || '#inbox';

          // Update state after navigation
          setTimeout(() => {
            this.updateGmailState();
            this.registerContextAwareTools();
          }, 1000);

          return this.formatSuccess({
            navigatedTo: page,
            message: 'Navigated successfully. State updated.',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );

    log('info', 'Core tools registered');
  }

  /**
   * Register context-aware tools based on current Gmail state
   */
  private registerContextAwareTools(): void {
    // Register core email tools
    this.registerEmailListTools();
    this.registerWriteTools(); // Always available for compose operations
    this.registerSearchTools();

    if (this.isInEmail) {
      this.registerEmailViewTools();
    } else {
      this.disableTool('read_current_email');
      this.disableTool('get_email_thread');
    }

    if (this.isComposing) {
      this.registerComposeTools();
    } else {
      this.disableTool('get_compose_data');
      this.disableTool('update_compose');
      this.disableTool('send_compose');
    }

    log(
      'info',
      `Context-aware tools registered for state: page=${this.currentPage}, inEmail=${this.isInEmail}, composing=${this.isComposing}`
    );
  }

  /**
   * Register tools for email list views (inbox, sent, starred, etc.)
   */
  private registerEmailListTools(): void {
    this.safeRegisterTool(
      'list_visible_emails',
      {
        title: 'List Visible Emails',
        description: `List visible emails/threads from the current Gmail view (${this.currentPage}). Shows email summaries including sender, subject, and thread ID.`,
        inputSchema: {
          limit: z
            .number()
            .min(1)
            .max(50)
            .default(20)
            .describe('Maximum number of emails/threads to return'),
        },
        annotations: {
          readOnlyHint: true,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async ({ limit }: { limit: number }) => {
        try {
          const visibleMessages = this.gmail.dom.visible_messages().slice(0, limit);
          const data = visibleMessages.map(msg => ({
            threadId: msg.thread_id,
            subject: msg.summary,
            from: {
              email: msg.from.email,
              name: msg.from.name,
            },
            summary: msg.summary,
          }));
          return this.formatSuccess(data);
        } catch (error) {
          return this.formatError(error);
        }
      }
    );

    this.safeRegisterTool(
      'get_selected_emails',
      {
        title: 'Get Selected Emails',
        description: 'Get information about currently selected emails in the Gmail interface',
        inputSchema: {},
        annotations: {
          readOnlyHint: true,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async () => {
        try {
          const selectedElements = document.querySelectorAll(
            'tr.zA.zE[role="row"][tabindex="0"]:checked, tr.zA.zE[role="row"].x7'
          );
          const data = {
            selectedCount: selectedElements.length,
            emails: Array.from(selectedElements).map((el: Element) => {
              const threadIdAttr = el.getAttribute('id');
              const subjectEl = el.querySelector('[data-thread-perm-id]');
              return {
                threadId: threadIdAttr || 'unknown',
                subject: subjectEl?.textContent?.trim() || 'No subject',
                element: 'Selected via DOM',
              };
            }),
          };
          return this.formatSuccess(data);
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  /**
   * Register tools for when viewing an individual email
   */
  private registerEmailViewTools(): void {
    this.safeRegisterTool(
      'read_current_email',
      {
        title: 'Read Current Email',
        description: 'Read the currently open email with full content, metadata, and attachments',
        inputSchema: {},
        annotations: {
          readOnlyHint: true,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async () => {
        try {
          if (!this.isInEmail) {
            throw new Error(
              'Not currently viewing an email. Use navigate_to_page or open_email first.'
            );
          }

          const emailId = this.gmail.new.get.email_id();
          if (!emailId) {
            throw new Error('Could not determine current email ID. Try refreshing the page.');
          }

          const emailData = this.gmail.new.get.email_data(emailId);
          if (!emailData) {
            throw new Error(
              'No email data found in cache. Try reopening the email or waiting for cache population.'
            );
          }

          const data = {
            id: emailData.id,
            subject: emailData.subject,
            from: emailData.from,
            to: emailData.to,
            cc: emailData.cc || [],
            bcc: emailData.bcc || [],
            date: emailData.date,
            timestamp: emailData.timestamp,
            contentHtml: emailData.content_html,
            attachments: emailData.attachments || [],
          };
          return this.formatSuccess(data);
        } catch (error) {
          return this.formatError(error);
        }
      }
    );

    this.safeRegisterTool(
      'get_email_thread',
      {
        title: 'Get Full Email Thread',
        description: 'Get the complete thread/conversation containing the current email',
        inputSchema: {},
        annotations: {
          readOnlyHint: true,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async () => {
        try {
          const threadId = this.gmail.new.get.thread_id();
          const threadData = this.gmail.new.get.thread_data(threadId);

          if (!threadData) {
            throw new Error('No thread data found in cache.');
          }

          const data = {
            threadId: threadData.thread_id,
            totalEmails: threadData.emails.length,
            emails: threadData.emails.map(email => ({
              id: email.id,
              subject: email.subject,
              from: email.from,
              timestamp: email.timestamp,
              snippet: email.content_html ? `${email.content_html.substring(0, 200)}...` : '',
            })),
          };
          return this.formatSuccess(data);
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  /**
   * Register tools for compose mode
   */
  private registerComposeTools(): void {
    this.safeRegisterTool(
      'get_compose_data',
      {
        title: 'Get Compose Data',
        description:
          'Get information about the current compose window(s) including recipients, subject, and body. Supports multiple composes.',
        inputSchema: {
          composeId: z
            .string()
            .optional()
            .describe('Specific compose ID to target (from get_compose_ids)'),
        },
        annotations: {
          readOnlyHint: true,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async ({ composeId }: { composeId?: string }) => {
        try {
          const composes = this.gmail.dom.composes();
          let targetComposes = composes;
          if (composeId) {
            targetComposes = composes.filter(c => c.id() === composeId);
            if (targetComposes.length === 0) {
              throw new Error(`Compose window ${composeId} not found.`);
            }
          }
          const data = {
            activeComposes: composes.length,
            composeData: targetComposes.map(compose => ({
              id: compose.id(),
              type: compose.type(),
              isInline: compose.is_inline(),
              to: compose.to().val() as string,
              cc: compose.cc().val() as string,
              bcc: compose.bcc().val() as string,
              subject: compose.subject(),
              from: compose.from(),
              body: compose.body(),
            })),
          };
          return this.formatSuccess(data);
        } catch (error) {
          return this.formatError(error);
        }
      }
    );

    this.safeRegisterTool(
      'update_compose',
      {
        title: 'Update Compose Fields',
        description: 'Update recipients, subject, or body of a compose window.',
        inputSchema: {
          composeId: z.string().optional().describe('Specific compose ID to target'),
          to: z.array(z.string().email()).optional().describe('Update TO recipients'),
          cc: z.array(z.string().email()).optional().describe('Update CC recipients'),
          bcc: z.array(z.string().email()).optional().describe('Update BCC recipients'),
          subject: z.string().optional().describe('Update email subject'),
          body: z.string().optional().describe('Update email body content'),
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (params: {
        composeId?: string;
        to?: string[];
        cc?: string[];
        bcc?: string[];
        subject?: string;
        body?: string;
      }) => {
        try {
          const composes = this.gmail.dom.composes();
          let compose;
          if (params.composeId) {
            compose = composes.find(c => c.id() === params.composeId);
            if (!compose) throw new Error(`Compose ${params.composeId} not found.`);
          } else if (composes.length > 0) {
            compose = composes[0]; // Default to first
          } else {
            throw new Error('No compose window found.');
          }

          const updates: string[] = [];

          if (params.to) {
            compose.to(params.to.join(', '));
            updates.push(`TO: ${params.to.join(', ')}`);
          }
          if (params.cc) {
            compose.cc(params.cc.join(', '));
            updates.push(`CC: ${params.cc.join(', ')}`);
          }
          if (params.bcc) {
            compose.bcc(params.bcc.join(', '));
            updates.push(`BCC: ${params.bcc.join(', ')}`);
          }
          if (params.subject) {
            compose.subject(params.subject);
            updates.push(`Subject: ${params.subject}`);
          }
          if (params.body) {
            compose.body(params.body);
            updates.push('Body updated');
          }

          return this.formatSuccess(
            `Updated compose fields: ${updates.join(', ')}. State: Composing updated.`
          );
        } catch (error) {
          return this.formatError(error);
        }
      }
    );

    this.safeRegisterTool(
      'send_compose',
      {
        title: 'Send Email',
        description: 'Send a compose email.',
        inputSchema: {
          composeId: z.string().optional().describe('Specific compose ID to send'),
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: true,
        },
      },
      async ({ composeId }: { composeId?: string }) => {
        try {
          const composes = this.gmail.dom.composes();
          let compose;
          if (composeId) {
            compose = composes.find(c => c.id() === composeId);
            if (!compose) throw new Error(`Compose ${composeId} not found.`);
          } else if (composes.length > 0) {
            compose = composes[0];
          } else {
            throw new Error('No compose window found');
          }

          compose.send();

          // Update state
          setTimeout(() => this.updateGmailState(), 500);

          return this.formatSuccess('Email sent successfully. State: Compose closed.');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  /**
   * Register write tools (only when write permissions enabled)
   */
  private registerWriteTools(): void {
    this.safeRegisterTool(
      'compose_new_email',
      {
        title: 'Compose New Email',
        description:
          'Create and compose a complete new email with recipients, subject, and body. Opens a compose window, fills fields, and optionally sends.',
        inputSchema: {
          to: z.array(z.string().email()).min(1).describe('Email recipients (required)'),
          subject: z.string().min(1).describe('Email subject line'),
          body: z.string().describe('Email body content (supports HTML)'),
          cc: z.array(z.string().email()).optional().describe('CC recipients'),
          bcc: z.array(z.string().email()).optional().describe('BCC recipients'),
          send: z.boolean().default(false).describe('Whether to send immediately after composing'),
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: true,
        },
      },
      async (params: {
        to: string[];
        subject: string;
        body: string;
        cc?: string[];
        bcc?: string[];
        send?: boolean;
      }) => {
        try {
          // Start compose
          this.gmail.compose.start_compose();

          return await new Promise((resolve, reject) => {
            const timeout = setTimeout(
              () => reject(new Error('Timeout waiting for compose')),
              5000
            );

            const handler = (compose: any, type: string) => {
              if (type === 'compose') {
                clearTimeout(timeout);
                this.gmail.observe.off('compose', 'after');

                try {
                  setTimeout(() => {
                    compose.to(params.to.join(', '));
                    if (params.cc) compose.cc(params.cc.join(', '));
                    if (params.bcc) compose.bcc(params.bcc.join(', '));
                    compose.subject(params.subject);
                    compose.body(params.body);

                    this.isComposing = true;
                    this.registerContextAwareTools();

                    const result = {
                      composed: true,
                      to: params.to,
                      subject: params.subject,
                      cc: params.cc || [],
                      bcc: params.bcc || [],
                      status: params.send ? 'Sent' : 'Draft saved (use send_compose to send)',
                    };

                    if (params.send) {
                      setTimeout(() => compose.send(), 300);
                    }

                    resolve(this.formatSuccess(result));
                  }, 200);
                } catch (error) {
                  reject(error);
                }
              }
            };

            this.gmail.observe.on('compose', handler);
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );

    this.safeRegisterTool(
      'start_compose',
      {
        title: 'Start New Compose',
        description: 'Open a new empty email compose window. Use update_compose to fill fields.',
        inputSchema: {},
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async () => {
        try {
          this.gmail.compose.start_compose();

          setTimeout(() => {
            this.isComposing = this.gmail.dom.composes().length > 0;
            if (this.isComposing) {
              this.registerContextAwareTools();
            }
          }, 1000);

          return this.formatSuccess({
            message: 'New compose window opened.',
            composeIds: this.gmail.get.compose_ids(),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  /**
   * Register search tools (useful in all contexts)
   */
  private registerSearchTools(): void {
    this.safeRegisterTool(
      'search_emails',
      {
        title: 'Search Emails',
        description:
          'Search for emails using Gmail search syntax. Supports operators like from:, to:, subject:, has:attachment, etc.',
        inputSchema: {
          query: z.string().min(1).describe('Gmail search query (supports Gmail search operators)'),
          executeSearch: z
            .boolean()
            .default(true)
            .describe('Execute the search in Gmail interface and update view'),
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: true,
        },
      },
      async ({ query, executeSearch }: { query: string; executeSearch: boolean }) => {
        try {
          if (executeSearch) {
            window.location.hash = `#search/${encodeURIComponent(query)}`;
            setTimeout(() => {
              this.updateGmailState();
              this.registerContextAwareTools();
            }, 1000);
            return this.formatSuccess({
              searched: query,
              message: 'Search executed. View updated; use list_visible_emails to see results.',
            });
          }

          const currentQuery = this.gmail.get.search_query();
          return this.formatSuccess({
            currentQuery: currentQuery || 'No active search',
            requestedQuery: query,
            note: 'Use executeSearch: true to perform the search and update state.',
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );

    this.safeRegisterTool(
      'get_current_search',
      {
        title: 'Get Current Search Query',
        description: 'Get the currently active search query in Gmail',
        inputSchema: {},
        annotations: {
          readOnlyHint: true,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async () => {
        try {
          const query = this.gmail.get.search_query();
          return this.formatSuccess({
            query: query || null,
            hasActiveSearch: !!query,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  /**
   * Set up Gmail observers for dynamic tool updates and AI state
   */
  private setupGmailObservers(): void {
    const navigationHandler = () => {
      setTimeout(() => {
        const oldState = {
          page: this.currentPage,
          inEmail: this.isInEmail,
          composing: this.isComposing,
        };
        this.updateGmailState();
        if (
          JSON.stringify(oldState) !==
          JSON.stringify({
            page: this.currentPage,
            inEmail: this.isInEmail,
            composing: this.isComposing,
          })
        ) {
          this.registerContextAwareTools();
          log(
            'info',
            `State changed: ${JSON.stringify(oldState)} → ${JSON.stringify({ page: this.currentPage, inEmail: this.isInEmail, composing: this.isComposing })}. Tools updated.`
          );
        }
      }, 500);
    };

    this.gmail.observe.on('view_thread', navigationHandler);
    this.gmail.observe.on('view_email', navigationHandler);
    this.gmail.observe.on('compose', navigationHandler);
    this.gmail.observe.on('compose_cancelled', navigationHandler);
    this.gmail.observe.on('refresh', navigationHandler);

    // Store for cleanup
    this.contextObservers.set('navigation', () => {
      this.gmail.observe.off('view_thread', 'after');
      this.gmail.observe.off('view_email', 'after');
      this.gmail.observe.off('compose', 'after');
      this.gmail.observe.off('compose_cancelled', 'after');
      this.gmail.observe.off('refresh', 'after');
    });

    log('info', 'Gmail observers set up for dynamic updates and state management');
  }

  /**
   * Cleanup method
   */
  private cleanup(): void {
    for (const cleanup of this.contextObservers.values()) {
      cleanup();
    }
    this.contextObservers.clear();
    log('info', 'Cleanup completed');
  }

  public getServer(): McpServer {
    return this.server;
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public shutdown(): void {
    this.cleanup();
    this.initialized = false;
  }
}

// Global instance
let gmailServer: GmailMCPServer | null = null;

async function initializeServer() {
  if (!gmailServer) {
    gmailServer = new GmailMCPServer();
    (window as any).gmailMCPServer = gmailServer;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeServer);
} else {
  initializeServer();
}

// Navigation observer for SPA
let lastUrl = location.href;
const navigationObserver = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    setTimeout(() => {
      if (!gmailServer || !gmailServer.isInitialized()) {
        initializeServer();
      }
    }, 1500);
  }
});

navigationObserver.observe(document.body, { subtree: true, childList: true });

// Cleanup on unload
window.addEventListener('beforeunload', () => {
  if (gmailServer) {
    gmailServer.shutdown();
  }
});

log('info', 'Enhanced Gmail MCP Server script loaded');
