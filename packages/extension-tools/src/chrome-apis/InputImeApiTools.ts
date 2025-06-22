import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface InputImeApiToolsOptions {
  setComposition?: boolean;
  clearComposition?: boolean;
  commitText?: boolean;
  sendKeyEvents?: boolean;
  hideInputView?: boolean;
  setCandidateWindowProperties?: boolean;
  setCandidates?: boolean;
  setCursorPosition?: boolean;
  setMenuItems?: boolean;
  updateMenuItems?: boolean;
  deleteSurroundingText?: boolean;
}

export class InputImeApiTools extends BaseApiTools {
  protected apiName = 'Input.ime';

  constructor(server: McpServer, options: InputImeApiToolsOptions = {}) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.input || !chrome.input.ime) {
        return {
          available: false,
          message: 'chrome.input.ime API is not defined',
          details:
            'This extension needs the "input" permission in its manifest.json and must run on ChromeOS',
        };
      }

      // Test a basic method
      if (typeof chrome.input.ime.commitText !== 'function') {
        return {
          available: false,
          message: 'chrome.input.ime.commitText is not available',
          details:
            'The input.ime API appears to be partially available. Check manifest permissions and platform support.',
        };
      }

      return {
        available: true,
        message: 'Input.ime API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.input.ime API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('setComposition')) {
      this.registerSetComposition();
    }

    if (this.shouldRegisterTool('clearComposition')) {
      this.registerClearComposition();
    }

    if (this.shouldRegisterTool('commitText')) {
      this.registerCommitText();
    }

    if (this.shouldRegisterTool('sendKeyEvents')) {
      this.registerSendKeyEvents();
    }

    if (this.shouldRegisterTool('hideInputView')) {
      this.registerHideInputView();
    }

    if (this.shouldRegisterTool('setCandidateWindowProperties')) {
      this.registerSetCandidateWindowProperties();
    }

    if (this.shouldRegisterTool('setCandidates')) {
      this.registerSetCandidates();
    }

    if (this.shouldRegisterTool('setCursorPosition')) {
      this.registerSetCursorPosition();
    }

    if (this.shouldRegisterTool('setMenuItems')) {
      this.registerSetMenuItems();
    }

    if (this.shouldRegisterTool('updateMenuItems')) {
      this.registerUpdateMenuItems();
    }

    if (this.shouldRegisterTool('deleteSurroundingText')) {
      this.registerDeleteSurroundingText();
    }
  }

  private registerSetComposition(): void {
    this.server.registerTool(
      'set_composition',
      {
        description: 'Set the current composition text and cursor position',
        inputSchema: {
          contextID: z
            .number()
            .describe('ID of the context where the composition text will be set'),
          text: z.string().describe('Text to set as the current composition'),
          selectionStart: z.number().optional().describe('Position to start the selection'),
          selectionEnd: z.number().optional().describe('Position to end the selection'),
          cursor: z.number().describe('Position to set the cursor'),
          segments: z
            .array(
              z.object({
                start: z.number().describe('Start position of the segment'),
                end: z.number().describe('End position of the segment'),
                style: z
                  .enum(['underline', 'doubleUnderline', 'noUnderline'])
                  .describe('Style of the segment'),
              })
            )
            .optional()
            .describe('Array of segments with styling information'),
        },
      },
      async ({ contextID, text, selectionStart, selectionEnd, cursor, segments }) => {
        try {
          const parameters: chrome.input.ime.CompositionParameters = {
            contextID,
            text,
            cursor,
          };

          if (selectionStart !== undefined) {
            parameters.selectionStart = selectionStart;
          }

          if (selectionEnd !== undefined) {
            parameters.selectionEnd = selectionEnd;
          }

          if (segments !== undefined) {
            parameters.segments = segments;
          }

          const success = await new Promise<boolean>((resolve, reject) => {
            chrome.input.ime.setComposition(parameters, (success) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(success);
              }
            });
          });

          return this.formatSuccess('Composition set successfully', {
            contextID,
            text,
            cursor,
            success,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerClearComposition(): void {
    this.server.registerTool(
      'clear_composition',
      {
        description: 'Clear the current composition text',
        inputSchema: {
          contextID: z.number().describe('ID of the context where the composition will be cleared'),
        },
      },
      async ({ contextID }) => {
        try {
          const success = await new Promise<boolean>((resolve, reject) => {
            chrome.input.ime.clearComposition({ contextID }, (success) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(success);
              }
            });
          });

          return this.formatSuccess('Composition cleared successfully', {
            contextID,
            success,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerCommitText(): void {
    this.server.registerTool(
      'commit_text',
      {
        description: 'Commit the provided text to the current input',
        inputSchema: {
          contextID: z.number().describe('ID of the context where the text will be committed'),
          text: z.string().describe('The text to commit'),
        },
      },
      async ({ contextID, text }) => {
        try {
          const success = await new Promise<boolean>((resolve, reject) => {
            chrome.input.ime.commitText({ contextID, text }, (success) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(success);
              }
            });
          });

          return this.formatSuccess('Text committed successfully', {
            contextID,
            text,
            success,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSendKeyEvents(): void {
    this.server.registerTool(
      'send_key_events',
      {
        description: 'Send key events to the system',
        inputSchema: {
          contextID: z.number().describe('ID of the context where the key events will be sent'),
          keyData: z
            .array(
              z.object({
                type: z.enum(['keyup', 'keydown']).describe('Type of key event'),
                requestId: z.string().optional().describe('Request ID for the key event'),
                key: z.string().describe('The key value'),
                code: z.string().describe('The key code'),
                keyCode: z.number().optional().describe('The key code number'),
                altKey: z.boolean().optional().describe('Whether Alt key is pressed'),
                ctrlKey: z.boolean().optional().describe('Whether Ctrl key is pressed'),
                shiftKey: z.boolean().optional().describe('Whether Shift key is pressed'),
                capsLock: z.boolean().optional().describe('Whether Caps Lock is on'),
              })
            )
            .describe('Array of key events to send'),
        },
      },
      async ({ contextID, keyData }) => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.input.ime.sendKeyEvents({ contextID, keyData }, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Key events sent successfully', {
            contextID,
            eventCount: keyData.length,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerHideInputView(): void {
    this.server.registerTool(
      'hide_input_view',
      {
        description: 'Hide the input view window',
        inputSchema: {},
      },
      async () => {
        try {
          chrome.input.ime.hideInputView();
          return this.formatSuccess('Input view hidden successfully');
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetCandidateWindowProperties(): void {
    this.server.registerTool(
      'set_candidate_window_properties',
      {
        description: 'Set the properties of the candidate window',
        inputSchema: {
          engineID: z.string().describe('ID of the engine to set candidate window properties'),
          properties: z
            .object({
              visible: z.boolean().optional().describe('Whether the candidate window is visible'),
              cursorVisible: z.boolean().optional().describe('Whether the cursor is visible'),
              vertical: z.boolean().optional().describe('Whether the candidate window is vertical'),
              pageSize: z.number().optional().describe('Number of candidates to display per page'),
              auxiliaryText: z.string().optional().describe('Auxiliary text to show'),
              auxiliaryTextVisible: z
                .boolean()
                .optional()
                .describe('Whether auxiliary text is visible'),
              windowPosition: z
                .enum(['cursor', 'composition'])
                .optional()
                .describe('Where to display the candidate window'),
            })
            .describe('Properties to set for the candidate window'),
        },
      },
      async ({ engineID, properties }) => {
        try {
          const success = await new Promise<boolean>((resolve, reject) => {
            chrome.input.ime.setCandidateWindowProperties({ engineID, properties }, (success) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(success);
              }
            });
          });

          return this.formatSuccess('Candidate window properties set successfully', {
            engineID,
            properties,
            success,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetCandidates(): void {
    this.server.registerTool(
      'set_candidates',
      {
        description: 'Set the current candidates',
        inputSchema: {
          contextID: z.number().describe('ID of the context to set candidates for'),
          candidates: z
            .array(
              z.object({
                candidate: z.string().describe('The candidate text'),
                id: z.number().describe('The candidate ID'),
                parentId: z.number().optional().describe('The parent candidate ID'),
                label: z.string().optional().describe('The candidate label'),
                annotation: z.string().optional().describe('The candidate annotation'),
                usage: z
                  .object({
                    title: z.string().describe('Usage title'),
                    body: z.string().describe('Usage body'),
                  })
                  .optional()
                  .describe('Usage information for the candidate'),
              })
            )
            .describe('Array of candidates to set'),
        },
      },
      async ({ contextID, candidates }) => {
        try {
          const success = await new Promise<boolean>((resolve, reject) => {
            chrome.input.ime.setCandidates({ contextID, candidates }, (success) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(success);
              }
            });
          });

          return this.formatSuccess('Candidates set successfully', {
            contextID,
            candidateCount: candidates.length,
            success,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetCursorPosition(): void {
    this.server.registerTool(
      'set_cursor_position',
      {
        description: 'Set the position of the cursor in the candidate window',
        inputSchema: {
          contextID: z.number().describe('ID of the context to set cursor position for'),
          candidateID: z.number().describe('ID of the candidate to position cursor on'),
        },
      },
      async ({ contextID, candidateID }) => {
        try {
          const success = await new Promise<boolean>((resolve, reject) => {
            chrome.input.ime.setCursorPosition({ contextID, candidateID }, (success) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(success);
              }
            });
          });

          return this.formatSuccess('Cursor position set successfully', {
            contextID,
            candidateID,
            success,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerSetMenuItems(): void {
    this.server.registerTool(
      'set_menu_items',
      {
        description: 'Set the current menu items',
        inputSchema: {
          engineID: z.string().describe('ID of the engine to set menu items for'),
          items: z
            .array(
              z.object({
                id: z.string().describe('Menu item ID'),
                label: z.string().optional().describe('Menu item label'),
                style: z
                  .enum(['check', 'radio', 'separator'])
                  .optional()
                  .describe('Menu item style'),
                visible: z.boolean().optional().describe('Whether the menu item is visible'),
                checked: z.boolean().optional().describe('Whether the menu item is checked'),
                enabled: z.boolean().optional().describe('Whether the menu item is enabled'),
              })
            )
            .describe('Array of menu items to set'),
        },
      },
      async ({ engineID, items }) => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.input.ime.setMenuItems({ engineID, items }, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Menu items set successfully', {
            engineID,
            itemCount: items.length,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerUpdateMenuItems(): void {
    this.server.registerTool(
      'update_menu_items',
      {
        description: 'Update the current menu items',
        inputSchema: {
          engineId: z.string().describe('ID of the engine to update menu items for'),
          items: z
            .array(
              z.object({
                id: z.string().describe('Menu item ID'),
                label: z.string().optional().describe('Menu item label'),
                style: z
                  .enum(['check', 'radio', 'separator'])
                  .optional()
                  .describe('Menu item style'),
                visible: z.boolean().optional().describe('Whether the menu item is visible'),
                checked: z.boolean().optional().describe('Whether the menu item is checked'),
                enabled: z.boolean().optional().describe('Whether the menu item is enabled'),
              })
            )
            .describe('Array of menu items to update'),
        },
      },
      async ({ engineId, items }) => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.input.ime.updateMenuItems({ engineId, items }, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Menu items updated successfully', {
            engineId,
            itemCount: items.length,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }

  private registerDeleteSurroundingText(): void {
    this.server.registerTool(
      'delete_surrounding_text',
      {
        description: 'Delete the text around the cursor',
        inputSchema: {
          contextID: z.number().describe('ID of the context to delete surrounding text from'),
          offset: z.number().describe('Offset from the cursor position'),
          length: z.number().describe('Number of characters to delete'),
          engineID: z.string().describe('ID of the engine requesting the deletion'),
        },
      },
      async ({ contextID, offset, length, engineID }) => {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.input.ime.deleteSurroundingText({ contextID, offset, length, engineID }, () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve();
              }
            });
          });

          return this.formatSuccess('Surrounding text deleted successfully', {
            contextID,
            offset,
            length,
            engineID,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}
