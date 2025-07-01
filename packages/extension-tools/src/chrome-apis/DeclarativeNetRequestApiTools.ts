import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { type ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface DeclarativeNetRequestApiToolsOptions {
  getDynamicRules?: boolean;
  updateDynamicRules?: boolean;
  getSessionRules?: boolean;
  updateSessionRules?: boolean;
  getEnabledRulesets?: boolean;
  updateEnabledRulesets?: boolean;
  updateStaticRules?: boolean;
  getAvailableStaticRuleCount?: boolean;
  getMatchedRules?: boolean;
  isRegexSupported?: boolean;
  testMatchOutcome?: boolean;
  setExtensionActionOptions?: boolean;
}

export class DeclarativeNetRequestApiTools extends BaseApiTools {
  protected apiName = 'DeclarativeNetRequest';

  constructor(server: McpServer, options: DeclarativeNetRequestApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.declarativeNetRequest) {
        return {
          available: false,
          message: 'chrome.declarativeNetRequest API is not defined',
          details:
            'This extension needs the "declarativeNetRequest" or "declarativeNetRequestWithHostAccess" permission in its manifest.json',
        };
      }

      // Test a basic method
      if (typeof chrome.declarativeNetRequest.getDynamicRules !== 'function') {
        return {
          available: false,
          message: 'chrome.declarativeNetRequest.getDynamicRules is not available',
          details:
            'The declarativeNetRequest API appears to be partially available. Check manifest permissions.',
        };
      }

      // Try to actually use the API
      chrome.declarativeNetRequest.getDynamicRules((_rules) => {
        if (chrome.runtime.lastError) {
          throw new Error(chrome.runtime.lastError.message);
        }
      });

      return {
        available: true,
        message: 'DeclarativeNetRequest API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.declarativeNetRequest API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('getDynamicRules')) {
      this.registerGetDynamicRules();
    }

    if (this.shouldRegisterTool('updateDynamicRules')) {
      this.registerUpdateDynamicRules();
    }

    if (this.shouldRegisterTool('getSessionRules')) {
      this.registerGetSessionRules();
    }

    if (this.shouldRegisterTool('updateSessionRules')) {
      this.registerUpdateSessionRules();
    }

    if (this.shouldRegisterTool('getEnabledRulesets')) {
      this.registerGetEnabledRulesets();
    }

    if (this.shouldRegisterTool('updateEnabledRulesets')) {
      this.registerUpdateEnabledRulesets();
    }

    if (this.shouldRegisterTool('updateStaticRules')) {
      this.registerUpdateStaticRules();
    }

    if (this.shouldRegisterTool('getAvailableStaticRuleCount')) {
      this.registerGetAvailableStaticRuleCount();
    }

    if (this.shouldRegisterTool('getMatchedRules')) {
      this.registerGetMatchedRules();
    }

    if (this.shouldRegisterTool('isRegexSupported')) {
      this.registerIsRegexSupported();
    }

    if (this.shouldRegisterTool('testMatchOutcome')) {
      this.registerTestMatchOutcome();
    }

    if (this.shouldRegisterTool('setExtensionActionOptions')) {
      this.registerSetExtensionActionOptions();
    }
  }

  private registerGetDynamicRules(): void {
    this.server.registerTool(
      'extension_tool_get_dynamic_rules',
      {
        description: 'Get the current set of dynamic rules for the extension',
      },
      async () => {
        try {
          const rules = await new Promise<chrome.declarativeNetRequest.Rule[]>(
            (resolve, reject) => {
              chrome.declarativeNetRequest.getDynamicRules((rules) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(rules);
                }
              });
            }
          );

          return this.formatJson({
            count: rules.length,
            rules: rules,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerUpdateDynamicRules(): void {
    this.server.registerTool(
      'extension_tool_update_dynamic_rules',
      {
        description: 'Modify the current set of dynamic rules for the extension',
        inputSchema: {
          removeRuleIds: z
            .array(z.number())
            .optional()
            .describe('IDs of the rules to remove. Any invalid IDs will be ignored'),
          addRules: z
            .array(z.any())
            .optional()
            .describe('Rules to add. Must follow the Rule schema'),
        },
      },
      async ({ removeRuleIds, addRules }) => {
        try {
          const options: chrome.declarativeNetRequest.UpdateRuleOptions = {};
          if (removeRuleIds !== undefined) {
            options.removeRuleIds = removeRuleIds;
          }
          if (addRules !== undefined) {
            options.addRules = addRules;
          }

          await new Promise<void>((resolve, reject) => {
            chrome.declarativeNetRequest.updateDynamicRules(options, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Dynamic rules updated successfully', {
            removedCount: removeRuleIds?.length || 0,
            addedCount: addRules?.length || 0,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetSessionRules(): void {
    this.server.registerTool(
      'extension_tool_get_session_rules',
      {
        description: 'Get the current set of session scoped rules for the extension',
      },
      async () => {
        try {
          const rules = await new Promise<chrome.declarativeNetRequest.Rule[]>(
            (resolve, reject) => {
              chrome.declarativeNetRequest.getSessionRules((rules) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(rules);
                }
              });
            }
          );

          return this.formatJson({
            count: rules.length,
            rules: rules,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerUpdateSessionRules(): void {
    this.server.registerTool(
      'extension_tool_update_session_rules',
      {
        description: 'Modify the current set of session scoped rules for the extension',
        inputSchema: {
          removeRuleIds: z
            .array(z.number())
            .optional()
            .describe('IDs of the rules to remove. Any invalid IDs will be ignored'),
          addRules: z
            .array(z.any())
            .optional()
            .describe('Rules to add. Must follow the Rule schema'),
        },
      },
      async ({ removeRuleIds, addRules }) => {
        try {
          const options: chrome.declarativeNetRequest.UpdateRuleOptions = {};
          if (removeRuleIds !== undefined) {
            options.removeRuleIds = removeRuleIds;
          }
          if (addRules !== undefined) {
            options.addRules = addRules;
          }

          await new Promise<void>((resolve, reject) => {
            chrome.declarativeNetRequest.updateSessionRules(options, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Session rules updated successfully', {
            removedCount: removeRuleIds?.length || 0,
            addedCount: addRules?.length || 0,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetEnabledRulesets(): void {
    this.server.registerTool(
      'extension_tool_get_enabled_rulesets',
      {
        description: 'Get the ids for the current set of enabled static rulesets',
        inputSchema: {},
      },
      async () => {
        try {
          const rulesetIds = await new Promise<string[]>((resolve, reject) => {
            chrome.declarativeNetRequest.getEnabledRulesets((rulesetIds) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(rulesetIds);
              }
            });
          });

          return this.formatJson({
            count: rulesetIds.length,
            rulesetIds: rulesetIds,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerUpdateEnabledRulesets(): void {
    this.server.registerTool(
      'extension_tool_update_enabled_rulesets',
      {
        description: 'Update the set of enabled static rulesets for the extension',
        inputSchema: {
          enableRulesetIds: z
            .array(z.string())
            .optional()
            .describe('The set of ids corresponding to a static Ruleset that should be enabled'),
          disableRulesetIds: z
            .array(z.string())
            .optional()
            .describe('The set of ids corresponding to a static Ruleset that should be disabled'),
        },
      },
      async ({ enableRulesetIds, disableRulesetIds }) => {
        try {
          const options: chrome.declarativeNetRequest.UpdateRulesetOptions = {};
          if (enableRulesetIds !== undefined) {
            options.enableRulesetIds = enableRulesetIds;
          }
          if (disableRulesetIds !== undefined) {
            options.disableRulesetIds = disableRulesetIds;
          }

          await new Promise<void>((resolve, reject) => {
            chrome.declarativeNetRequest.updateEnabledRulesets(options, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Enabled rulesets updated successfully', {
            enabledCount: enableRulesetIds?.length || 0,
            disabledCount: disableRulesetIds?.length || 0,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerUpdateStaticRules(): void {
    this.server.registerTool(
      'extension_tool_update_static_rules',
      {
        description: 'Disable and enable individual static rules in a Ruleset',
        inputSchema: {
          rulesetId: z.string().describe('The id corresponding to a static Ruleset'),
          enableRuleIds: z
            .array(z.number())
            .optional()
            .describe('Set of ids corresponding to rules in the Ruleset to enable'),
          disableRuleIds: z
            .array(z.number())
            .optional()
            .describe('Set of ids corresponding to rules in the Ruleset to disable'),
        },
      },
      async ({ rulesetId, enableRuleIds, disableRuleIds }) => {
        try {
          const options: chrome.declarativeNetRequest.UpdateStaticRulesOptions = {
            rulesetId: rulesetId,
          };
          if (enableRuleIds !== undefined) {
            options.enableRuleIds = enableRuleIds;
          }
          if (disableRuleIds !== undefined) {
            options.disableRuleIds = disableRuleIds;
          }

          await new Promise<void>((resolve, reject) => {
            chrome.declarativeNetRequest.updateStaticRules(options, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Static rules updated successfully', {
            rulesetId: rulesetId,
            enabledCount: enableRuleIds?.length || 0,
            disabledCount: disableRuleIds?.length || 0,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetAvailableStaticRuleCount(): void {
    this.server.registerTool(
      'extension_tool_get_available_static_rule_count',
      {
        description:
          'Get the number of static rules an extension can enable before the global static rule limit is reached',
        inputSchema: {},
      },
      async () => {
        try {
          const count = await new Promise<number>((resolve, reject) => {
            chrome.declarativeNetRequest.getAvailableStaticRuleCount((count) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(count);
              }
            });
          });

          return this.formatJson({
            availableStaticRuleCount: count,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerGetMatchedRules(): void {
    this.server.registerTool(
      'extension_tool_get_matched_rules',
      {
        description:
          'Get all rules matched for the extension. Requires "declarativeNetRequestFeedback" permission',
        inputSchema: {
          tabId: z
            .number()
            .optional()
            .describe(
              'If specified, only matches rules for the given tab. Matches rules not associated with any active tab if set to -1'
            ),
          minTimeStamp: z
            .number()
            .optional()
            .describe('If specified, only matches rules after the given timestamp'),
        },
      },
      async ({ tabId, minTimeStamp }) => {
        try {
          const filter: chrome.declarativeNetRequest.MatchedRulesFilter = {};
          if (tabId !== undefined) {
            filter.tabId = tabId;
          }
          if (minTimeStamp !== undefined) {
            filter.minTimeStamp = minTimeStamp;
          }

          const details = await new Promise<chrome.declarativeNetRequest.RulesMatchedDetails>(
            (resolve, reject) => {
              chrome.declarativeNetRequest.getMatchedRules(filter, (details) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(details);
                }
              });
            }
          );

          return this.formatJson({
            count: details.rulesMatchedInfo.length,
            rulesMatchedInfo: details.rulesMatchedInfo.map((info) => ({
              rule: info.rule,
              tabId: info.tabId,
              timeStamp: info.timeStamp,
              timeStampFormatted: new Date(info.timeStamp).toISOString(),
            })),
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerIsRegexSupported(): void {
    this.server.registerTool(
      'extension_tool_is_regex_supported',
      {
        description:
          'Check if the given regular expression will be supported as a regexFilter rule condition',
        inputSchema: {
          regex: z.string().describe('The regular expression to check'),
          isCaseSensitive: z
            .boolean()
            .optional()
            .describe('Whether the regex specified is case sensitive. Default is true'),
          requireCapturing: z
            .boolean()
            .optional()
            .describe('Whether the regex specified requires capturing. Default is false'),
        },
      },
      async ({ regex, isCaseSensitive, requireCapturing }) => {
        try {
          const regexOptions: chrome.declarativeNetRequest.RegexOptions = {
            regex: regex,
          };
          if (isCaseSensitive !== undefined) {
            regexOptions.isCaseSensitive = isCaseSensitive;
          }
          if (requireCapturing !== undefined) {
            regexOptions.requireCapturing = requireCapturing;
          }

          const result = await new Promise<chrome.declarativeNetRequest.IsRegexSupportedResult>(
            (resolve, reject) => {
              chrome.declarativeNetRequest.isRegexSupported(regexOptions, (result) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(result);
                }
              });
            }
          );

          return this.formatJson({
            regex: regex,
            isSupported: result.isSupported,
            reason: result.reason,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerTestMatchOutcome(): void {
    this.server.registerTool(
      'extension_tool_test_match_outcome',
      {
        description:
          "Check if any of the extension's declarativeNetRequest rules would match a hypothetical request. Only available for unpacked extensions",
        inputSchema: {
          url: z.string().describe('The URL of the hypothetical request'),
          type: z.string().describe('The resource type of the hypothetical request'),
          method: z
            .string()
            .optional()
            .describe(
              'Standard HTTP method of the hypothetical request. Defaults to "get" for HTTP requests'
            ),
          tabId: z
            .number()
            .optional()
            .describe(
              'The ID of the tab in which the hypothetical request takes place. Default is -1'
            ),
          initiator: z
            .string()
            .optional()
            .describe('The initiator URL (if any) for the hypothetical request'),
          responseHeaders: z
            .record(z.array(z.string()))
            .optional()
            .describe('The headers provided by a hypothetical response'),
        },
      },
      async ({ url, type, method, tabId, initiator, responseHeaders }) => {
        try {
          const request: chrome.declarativeNetRequest.TestMatchRequestDetails = {
            url: url,
            type: type as chrome.declarativeNetRequest.ResourceType,
          };
          if (method !== undefined) {
            request.method = method as chrome.declarativeNetRequest.RequestMethod;
          }
          if (tabId !== undefined) {
            request.tabId = tabId;
          }
          if (initiator !== undefined) {
            request.initiator = initiator;
          }
          if (responseHeaders !== undefined) {
            request.responseHeaders = responseHeaders;
          }

          const result = await new Promise<chrome.declarativeNetRequest.TestMatchOutcomeResult>(
            (resolve, reject) => {
              chrome.declarativeNetRequest.testMatchOutcome(request, (result) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(result);
                }
              });
            }
          );

          return this.formatJson({
            url: url,
            matchedRulesCount: result.matchedRules.length,
            matchedRules: result.matchedRules,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetExtensionActionOptions(): void {
    this.server.registerTool(
      'extension_tool_set_extension_action_options',
      {
        description:
          "Configure if the action count for tabs should be displayed as the extension action's badge text",
        inputSchema: {
          displayActionCountAsBadgeText: z
            .boolean()
            .optional()
            .describe(
              "Whether to automatically display the action count for a page as the extension's badge text"
            ),
          tabUpdateIncrement: z
            .number()
            .optional()
            .describe(
              "The amount to increment the tab's action count by. Negative values will decrement the count"
            ),
          tabUpdateTabId: z
            .number()
            .optional()
            .describe('The tab for which to update the action count'),
        },
      },
      async ({ displayActionCountAsBadgeText, tabUpdateIncrement, tabUpdateTabId }) => {
        try {
          const options: chrome.declarativeNetRequest.ExtensionActionOptions = {};

          if (displayActionCountAsBadgeText !== undefined) {
            options.displayActionCountAsBadgeText = displayActionCountAsBadgeText;
          }

          if (tabUpdateIncrement !== undefined && tabUpdateTabId !== undefined) {
            options.tabUpdate = {
              increment: tabUpdateIncrement,
              tabId: tabUpdateTabId,
            };
          }

          await new Promise<void>((resolve, reject) => {
            chrome.declarativeNetRequest.setExtensionActionOptions(options, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Extension action options updated successfully', {
            displayActionCountAsBadgeText: displayActionCountAsBadgeText,
            tabUpdate: options.tabUpdate,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
