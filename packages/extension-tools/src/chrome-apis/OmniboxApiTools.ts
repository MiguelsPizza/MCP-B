import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { type ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface OmniboxApiToolsOptions {
  setDefaultSuggestion?: boolean;
  onInputStarted?: boolean;
  onInputChanged?: boolean;
  onInputEntered?: boolean;
  onInputCancelled?: boolean;
  onDeleteSuggestion?: boolean;
}

export class OmniboxApiTools extends BaseApiTools {
  protected apiName = 'Omnibox';

  constructor(server: McpServer, options: OmniboxApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.omnibox) {
        return {
          available: false,
          message: 'chrome.omnibox API is not defined',
          details:
            'This extension needs the "omnibox" field in its manifest.json with a keyword specified',
        };
      }

      // Test a basic method
      if (typeof chrome.omnibox.setDefaultSuggestion !== 'function') {
        return {
          available: false,
          message: 'chrome.omnibox.setDefaultSuggestion is not available',
          details: 'The omnibox API appears to be partially available. Check manifest permissions.',
        };
      }

      // Try to actually use the API
      chrome.omnibox.setDefaultSuggestion({ description: 'Test' });

      return {
        available: true,
        message: 'Omnibox API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.omnibox API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('setDefaultSuggestion')) {
      this.registerSetDefaultSuggestion();
    }

    if (this.shouldRegisterTool('onInputStarted')) {
      this.registerOnInputStarted();
    }

    if (this.shouldRegisterTool('onInputChanged')) {
      this.registerOnInputChanged();
    }

    if (this.shouldRegisterTool('onInputEntered')) {
      this.registerOnInputEntered();
    }

    if (this.shouldRegisterTool('onInputCancelled')) {
      this.registerOnInputCancelled();
    }

    if (this.shouldRegisterTool('onDeleteSuggestion')) {
      this.registerOnDeleteSuggestion();
    }
  }

  private registerSetDefaultSuggestion(): void {
    this.server.registerTool(
      'extension_tool_set_default_suggestion',
      {
        description: 'Set the description and styling for the default suggestion in the omnibox',
        inputSchema: {
          description: z
            .string()
            .describe(
              'The text displayed in the URL dropdown. Can contain XML-style markup for styling with tags: url, match, dim'
            ),
        },
      },
      async ({ description }) => {
        try {
          chrome.omnibox.setDefaultSuggestion({ description });

          return this.formatSuccess('Default suggestion set successfully', {
            description,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerOnInputStarted(): void {
    this.server.registerTool(
      'extension_tool_add_input_started_listener',
      {
        description:
          'Add a listener for when user starts a keyword input session by typing the extension keyword',
        inputSchema: {},
      },
      async () => {
        try {
          chrome.omnibox.onInputStarted.addListener(() => {
            console.log('Omnibox input session started');
          });

          return this.formatSuccess('Input started listener added successfully');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerOnInputChanged(): void {
    this.server.registerTool(
      'extension_tool_add_input_changed_listener',
      {
        description: 'Add a listener for when user changes what is typed into the omnibox',
        inputSchema: {
          enableSuggestions: z
            .boolean()
            .optional()
            .default(true)
            .describe('Whether to provide example suggestions when input changes'),
        },
      },
      async ({ enableSuggestions }) => {
        try {
          chrome.omnibox.onInputChanged.addListener((text, suggest) => {
            console.log('Omnibox input changed:', text);

            if (enableSuggestions) {
              const suggestions: chrome.omnibox.SuggestResult[] = [
                {
                  content: `search_${text}`,
                  description: `Search for <match>${text}</match>`,
                },
                {
                  content: `navigate_${text}`,
                  description: `Navigate to <url>${text}</url>`,
                },
              ];
              suggest(suggestions);
            }
          });

          return this.formatSuccess('Input changed listener added successfully', {
            enableSuggestions,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerOnInputEntered(): void {
    this.server.registerTool(
      'extension_tool_add_input_entered_listener',
      {
        description: 'Add a listener for when user accepts what is typed into the omnibox',
        inputSchema: {},
      },
      async () => {
        try {
          chrome.omnibox.onInputEntered.addListener((text, disposition) => {
            console.log('Omnibox input entered:', text, 'disposition:', disposition);

            // Example action based on disposition
            switch (disposition) {
              case 'currentTab':
                console.log('Navigate in current tab');
                break;
              case 'newForegroundTab':
                console.log('Navigate in new foreground tab');
                break;
              case 'newBackgroundTab':
                console.log('Navigate in new background tab');
                break;
            }
          });

          return this.formatSuccess('Input entered listener added successfully');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerOnInputCancelled(): void {
    this.server.registerTool(
      'extension_tool_add_input_cancelled_listener',
      {
        description:
          'Add a listener for when user ends the keyword input session without accepting input',
        inputSchema: {},
      },
      async () => {
        try {
          chrome.omnibox.onInputCancelled.addListener(() => {
            console.log('Omnibox input session cancelled');
          });

          return this.formatSuccess('Input cancelled listener added successfully');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerOnDeleteSuggestion(): void {
    this.server.registerTool(
      'extension_tool_add_delete_suggestion_listener',
      {
        description: 'Add a listener for when user deletes a suggested result',
        inputSchema: {},
      },
      async () => {
        try {
          chrome.omnibox.onDeleteSuggestion.addListener((text) => {
            console.log('Omnibox suggestion deleted:', text);
          });

          return this.formatSuccess('Delete suggestion listener added successfully');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
