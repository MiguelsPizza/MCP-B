import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiAvailability, BaseApiTools } from '../BaseApiTools';

export interface DomApiToolsOptions {
  openOrClosedShadowRoot?: boolean;
}

export class DomApiTools extends BaseApiTools {
  protected apiName = 'Dom';

  constructor(
    server: McpServer,
    options: DomApiToolsOptions = {}
  ) {
    super(server, options);
  }

  checkAvailability(): ApiAvailability {
    try {
      // Check if API exists
      if (!chrome.dom) {
        return {
          available: false,
          message: 'chrome.dom API is not defined',
          details: 'This extension needs to be running in a content script context',
        };
      }

      // Test a basic method
      if (typeof chrome.dom.openOrClosedShadowRoot !== 'function') {
        return {
          available: false,
          message: 'chrome.dom.openOrClosedShadowRoot is not available',
          details: 'The dom API appears to be partially available. Check Chrome version (88+) and context.',
        };
      }

      return {
        available: true,
        message: 'Dom API is fully available',
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to access chrome.dom API',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  registerTools(): void {
    if (this.shouldRegisterTool('openOrClosedShadowRoot')) {
      this.registerOpenOrClosedShadowRoot();
    }
  }

  private registerOpenOrClosedShadowRoot(): void {
    this.server.registerTool(
      'open_or_closed_shadow_root',
      {
        description: 'Gets the open shadow root or the closed shadow root hosted by the specified element',
        inputSchema: {
          elementSelector: z
            .string()
            .describe('CSS selector to find the element that hosts the shadow root'),
          elementIndex: z
            .number()
            .optional()
            .default(0)
            .describe('Index of the element if multiple elements match the selector (default: 0)'),
        },
      },
      async ({ elementSelector, elementIndex = 0 }) => {
        try {
          // Find the element using the selector
          const elements = document.querySelectorAll(elementSelector);
          
          if (elements.length === 0) {
            return this.formatError(`No elements found matching selector: ${elementSelector}`);
          }

          if (elementIndex >= elements.length) {
            return this.formatError(
              `Element index ${elementIndex} is out of range. Found ${elements.length} elements.`
            );
          }

          const element = elements[elementIndex] as HTMLElement;
          
          if (!element) {
            return this.formatError('Selected element is not an HTMLElement');
          }

          // Get the shadow root
          const shadowRoot = chrome.dom.openOrClosedShadowRoot(element);

          if (!shadowRoot) {
            return this.formatSuccess('No shadow root found on the specified element', {
              elementSelector,
              elementIndex,
              tagName: element.tagName,
              id: element.id || null,
              className: element.className || null,
            });
          }

          // Get shadow root information
          const shadowRootInfo = {
            mode: shadowRoot.mode,
            delegatesFocus: shadowRoot.delegatesFocus,
            slotAssignment: shadowRoot.slotAssignment,
            childElementCount: shadowRoot.childElementCount,
            innerHTML: shadowRoot.innerHTML,
            textContent: shadowRoot.textContent,
            children: Array.from(shadowRoot.children).map((child, index) => ({
              index,
              tagName: child.tagName,
              id: child.id || null,
              className: child.className || null,
              textContent: child.textContent?.substring(0, 100) || null,
            })),
          };

          return this.formatJson({
            found: true,
            elementSelector,
            elementIndex,
            element: {
              tagName: element.tagName,
              id: element.id || null,
              className: element.className || null,
            },
            shadowRoot: shadowRootInfo,
          });
        } catch (error) {
          return this.formatError(error);
        }
      }
    );
  }
}