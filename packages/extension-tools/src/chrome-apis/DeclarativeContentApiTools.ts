import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface DeclarativeContentApiToolsOptions {
  addRules?: boolean;
  removeRules?: boolean;
  getRules?: boolean;
}

export class DeclarativeContentApiTools extends BaseApiTools {
  protected apiName = 'DeclarativeContent';

  constructor(server: McpServer, options: DeclarativeContentApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.declarativeContent) {
        return {
          available: false,
          message: 'chrome.declarativeContent API is not defined',
          details: 'This extension needs the "declarativeContent" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (!chrome.declarativeContent.onPageChanged) {
        return {
          available: false,
          message: 'chrome.declarativeContent.onPageChanged is not available',
          details:
            'The declarativeContent API appears to be partially available. Check manifest permissions.',
        };
      }

      // Check if required constructors exist
      if (typeof chrome.declarativeContent.PageStateMatcher !== 'function') {
        return {
          available: false,
          message: 'chrome.declarativeContent.PageStateMatcher constructor is not available',
          details: 'The declarativeContent API constructors are not accessible.',
        };
      }

      return {
        available: true,
        message: 'DeclarativeContent API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.declarativeContent API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('addRules')) {
      this.registerAddRules();
    }

    if (this.shouldRegisterTool('removeRules')) {
      this.registerRemoveRules();
    }

    if (this.shouldRegisterTool('getRules')) {
      this.registerGetRules();
    }
  }

  private registerAddRules(): void {
    this.server.registerTool(
      'add_declarative_rules',
      {
        description:
          'Add declarative content rules to control when the extension action is enabled',
        inputSchema: {
          rules: z
            .array(
              z.object({
                id: z.string().optional().describe('Optional unique identifier for this rule'),
                conditions: z
                  .array(
                    z.object({
                      pageUrl: z
                        .object({
                          hostContains: z
                            .string()
                            .optional()
                            .describe('Matches if the host contains this string'),
                          hostEquals: z
                            .string()
                            .optional()
                            .describe('Matches if the host equals this string'),
                          hostPrefix: z
                            .string()
                            .optional()
                            .describe('Matches if the host starts with this string'),
                          hostSuffix: z
                            .string()
                            .optional()
                            .describe('Matches if the host ends with this string'),
                          pathContains: z
                            .string()
                            .optional()
                            .describe('Matches if the path contains this string'),
                          pathEquals: z
                            .string()
                            .optional()
                            .describe('Matches if the path equals this string'),
                          pathPrefix: z
                            .string()
                            .optional()
                            .describe('Matches if the path starts with this string'),
                          pathSuffix: z
                            .string()
                            .optional()
                            .describe('Matches if the path ends with this string'),
                          queryContains: z
                            .string()
                            .optional()
                            .describe('Matches if the query contains this string'),
                          queryEquals: z
                            .string()
                            .optional()
                            .describe('Matches if the query equals this string'),
                          queryPrefix: z
                            .string()
                            .optional()
                            .describe('Matches if the query starts with this string'),
                          querySuffix: z
                            .string()
                            .optional()
                            .describe('Matches if the query ends with this string'),
                          urlContains: z
                            .string()
                            .optional()
                            .describe('Matches if the URL contains this string'),
                          urlEquals: z
                            .string()
                            .optional()
                            .describe('Matches if the URL equals this string'),
                          urlMatches: z
                            .string()
                            .optional()
                            .describe('Matches if the URL matches this regular expression'),
                          urlPrefix: z
                            .string()
                            .optional()
                            .describe('Matches if the URL starts with this string'),
                          urlSuffix: z
                            .string()
                            .optional()
                            .describe('Matches if the URL ends with this string'),
                          schemes: z
                            .array(z.string())
                            .optional()
                            .describe('Matches if the scheme is in this list'),
                          ports: z
                            .array(z.number())
                            .optional()
                            .describe('Matches if the port is in this list'),
                        })
                        .optional()
                        .describe('URL matching criteria'),
                      css: z
                        .array(z.string())
                        .optional()
                        .describe('CSS selectors that must match displayed elements'),
                      isBookmarked: z
                        .boolean()
                        .optional()
                        .describe(
                          'Whether the page must be bookmarked (requires bookmarks permission)'
                        ),
                    })
                  )
                  .describe('Conditions that must be met for the rule to trigger'),
                actions: z
                  .array(
                    z.object({
                      type: z.enum(['ShowAction', 'SetIcon']).describe('Type of action to perform'),
                      imageData: z
                        .record(z.string())
                        .optional()
                        .describe('Icon image data for SetIcon action'),
                    })
                  )
                  .describe('Actions to perform when conditions are met'),
              })
            )
            .describe('Array of declarative content rules to add'),
        },
      },
      async ({ rules }) => {
        try {
          // Convert the input rules to Chrome API format
          const chromeRules = rules.map((rule) => {
            const chromeRule: any = {
              conditions: rule.conditions.map((condition) => {
                const pageStateMatcher: any = {};

                if (condition.pageUrl) {
                  pageStateMatcher.pageUrl = condition.pageUrl;
                }

                if (condition.css) {
                  pageStateMatcher.css = condition.css;
                }

                if (condition.isBookmarked !== undefined) {
                  pageStateMatcher.isBookmarked = condition.isBookmarked;
                }

                return new chrome.declarativeContent.PageStateMatcher(pageStateMatcher);
              }),
              actions: rule.actions.map((action) => {
                if (action.type === 'ShowAction') {
                  return new chrome.declarativeContent.ShowAction();
                } else if (action.type === 'SetIcon') {
                  const setIconParams: any = {};
                  if (action.imageData) {
                    setIconParams.imageData = action.imageData;
                  }
                  return new chrome.declarativeContent.SetIcon(setIconParams);
                }
                throw new Error(`Unknown action type: ${action.type}`);
              }),
            };

            if (rule.id) {
              chromeRule.id = rule.id;
            }

            return chromeRule;
          });

          // Add the rules
          await new Promise<void>((resolve, reject) => {
            chrome.declarativeContent.onPageChanged.addRules(chromeRules, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Declarative content rules added successfully', {
            rulesAdded: rules.length,
            ruleIds: rules.map((rule) => rule.id).filter(Boolean),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerRemoveRules(): void {
    this.server.registerTool(
      'remove_declarative_rules',
      {
        description: 'Remove declarative content rules',
        inputSchema: {
          ruleIds: z
            .array(z.string())
            .optional()
            .describe('Array of rule IDs to remove. If not specified, all rules are removed'),
        },
      },
      async ({ ruleIds }) => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.declarativeContent.onPageChanged.removeRules(ruleIds, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          if (ruleIds && ruleIds.length > 0) {
            return this.formatSuccess('Specified declarative content rules removed successfully', {
              removedRuleIds: ruleIds,
            });
          } else {
            return this.formatSuccess('All declarative content rules removed successfully');
          }
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetRules(): void {
    this.server.registerTool(
      'get_declarative_rules',
      {
        description: 'Get existing declarative content rules',
        inputSchema: {
          ruleIds: z
            .array(z.string())
            .optional()
            .describe('Array of rule IDs to retrieve. If not specified, all rules are returned'),
        },
      },
      async ({ ruleIds }) => {
        try {
          const rules = await new Promise<chrome.events.Rule[]>((resolve, reject) => {
            chrome.declarativeContent.onPageChanged.getRules(ruleIds!, (rules) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(rules);
              }
            });
          });

          return this.formatJson({
            count: rules.length,
            rules: rules.map((rule) => ({
              id: rule.id,
              priority: rule.priority,
              conditions: rule.conditions?.length || 0,
              actions: rule.actions?.length || 0,
              tags: rule.tags,
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
