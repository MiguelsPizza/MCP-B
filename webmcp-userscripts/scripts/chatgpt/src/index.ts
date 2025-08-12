/// <reference types="vite-plugin-monkey/client" />
import { TabServerTransport } from '@mcp-b/transports';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import ChatGPTSelectors, { waitForSelector } from './selectors.js';

const server = new McpServer(
  {
    name: 'ChatGPT MCP Server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: { listChanged: true },
    },
  }
);

// Helper function to click an element
async function clickElement(selector: string): Promise<boolean> {
  const element = await waitForSelector(selector);
  if (element instanceof HTMLElement) {
    element.click();
    return true;
  }
  return false;
}

// Helper function to type text (React-compatible)
async function typeText(selector: string, text: string): Promise<boolean> {
  const element = await waitForSelector(selector);
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
    element.focus();

    // For React, we need to use the proper event flow
    const nativeInputValueSetter =
      Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set ||
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(element, text);
    } else {
      element.value = text;
    }

    // Trigger React's synthetic events
    const inputEvent = new Event('input', { bubbles: true, cancelable: true });
    const changeEvent = new Event('change', { bubbles: true, cancelable: true });

    element.dispatchEvent(inputEvent);
    element.dispatchEvent(changeEvent);

    return true;
  }
  return false;
}

/**
 * Authentication Tools
 */
server.registerTool(
  'chatgpt_login',
  {
    description: 'Click the login button to start authentication',
    inputSchema: {},
  },
  async () => {
    const clicked = await clickElement(ChatGPTSelectors.auth.loginButton);
    return {
      content: [
        {
          type: 'text',
          text: clicked ? 'Login button clicked successfully' : 'Failed to click login button',
        },
      ],
    };
  }
);

server.registerTool(
  'chatgpt_signup',
  {
    description: 'Click the sign up button to create a new account',
    inputSchema: {},
  },
  async () => {
    const clicked = await clickElement(ChatGPTSelectors.auth.signupButton);
    return {
      content: [
        {
          type: 'text',
          text: clicked ? 'Sign up button clicked successfully' : 'Failed to click sign up button',
        },
      ],
    };
  }
);

/**
 * Message Composition Tools
 */
server.registerTool(
  'chatgpt_type_message',
  {
    description: 'Type a message in the ChatGPT input field',
    inputSchema: {
      message: z.string().describe('The message to type in the input field'),
    },
  },
  async ({ message }) => {
    const typed = await typeText(ChatGPTSelectors.chat.messageInput, message);
    return {
      content: [
        {
          type: 'text',
          text: typed ? `Message typed: "${message}"` : 'Failed to type message',
        },
      ],
    };
  }
);

server.registerTool(
  'chatgpt_send_message',
  {
    description: 'Send the typed message by finding and clicking the send button',
    inputSchema: {},
  },
  async () => {
    const textarea = await waitForSelector(ChatGPTSelectors.chat.messageInput);
    if (textarea instanceof HTMLTextAreaElement) {
      // First try to find and click the send button (more reliable for React apps)
      const sendButton =
        document.querySelector('button[aria-label*="Send"]') ||
        document.querySelector('button[data-testid*="send"]') ||
        document.querySelector('button svg path[d*="M4.175 10.825"]')?.closest('button');

      if (sendButton instanceof HTMLElement && !sendButton.hasAttribute('disabled')) {
        sendButton.click();
        return {
          content: [
            {
              type: 'text',
              text: 'Message sent via button click',
            },
          ],
        };
      }

      // Fallback to keyboard event
      textarea.focus();
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true,
        composed: true,
      });
      textarea.dispatchEvent(event);

      // Also try keypress event for compatibility
      const keypressEvent = new KeyboardEvent('keypress', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true,
        composed: true,
      });
      textarea.dispatchEvent(keypressEvent);

      return {
        content: [
          {
            type: 'text',
            text: 'Message sent via Enter key',
          },
        ],
      };
    }
    return {
      content: [
        {
          type: 'text',
          text: 'Failed to send message - textarea not found',
        },
      ],
      isError: true,
    };
  }
);

/**
 * Quick Action Tools
 */
server.registerTool(
  'chatgpt_click_starter_prompt',
  {
    description: 'Click one of the starter prompt buttons',
    inputSchema: {
      prompt: z
        .enum(['analyze_data', 'brainstorm', 'make_plan', 'help_write', 'summarize_text'])
        .describe('The starter prompt to click'),
    },
  },
  async ({ prompt }) => {
    const selectorMap = {
      analyze_data: ChatGPTSelectors.quickActions.analyzeDataButton,
      brainstorm: ChatGPTSelectors.quickActions.brainstormButton,
      make_plan: ChatGPTSelectors.quickActions.makePlanButton,
      help_write: ChatGPTSelectors.quickActions.helpWriteButton,
      summarize_text: ChatGPTSelectors.quickActions.summarizeButton,
    };

    const clicked = await clickElement(selectorMap[prompt]);
    return {
      content: [
        {
          type: 'text',
          text: clicked
            ? `Clicked ${prompt.replace('_', ' ')} prompt`
            : `Failed to click ${prompt} prompt`,
        },
      ],
    };
  }
);

/**
 * Message Reading Tools
 */
server.registerTool(
  'chatgpt_get_messages',
  {
    description: 'Get all messages in the current conversation',
    inputSchema: {
      role: z
        .enum(['all', 'user', 'assistant'])
        .optional()
        .default('all')
        .describe('Filter messages by role'),
    },
  },
  async ({ role }) => {
    let selector = ChatGPTSelectors.messages.messageContainer;
    if (role === 'user') selector = ChatGPTSelectors.messages.userMessage;
    if (role === 'assistant') selector = ChatGPTSelectors.messages.assistantMessage;

    const messages = document.querySelectorAll(selector);
    const messageTexts = Array.from(messages).map((msg, index) => {
      const content = msg.querySelector('.prose')?.textContent || msg.textContent || '';
      const msgRole = msg.getAttribute('data-message-author-role') || 'unknown';
      return `[${index + 1}] ${msgRole}: ${content.trim()}`;
    });

    return {
      content: [
        {
          type: 'text',
          text: messageTexts.length > 0 ? messageTexts.join('\n\n---\n\n') : 'No messages found',
        },
      ],
    };
  }
);

server.registerTool(
  'chatgpt_get_last_message',
  {
    description: 'Get the last message in the conversation',
    inputSchema: {},
  },
  async () => {
    const messages = document.querySelectorAll(ChatGPTSelectors.messages.assistantMessage);
    const lastMessage = messages[messages.length - 1];

    if (lastMessage) {
      const content =
        lastMessage.querySelector('.prose')?.textContent || lastMessage.textContent || '';
      return {
        content: [
          {
            type: 'text',
            text: content.trim(),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: 'No messages found',
        },
      ],
    };
  }
);

/**
 * File Upload Tools
 */
server.registerTool(
  'chatgpt_attach_file',
  {
    description: 'Click the attach file button to prepare for file upload',
    inputSchema: {},
  },
  async () => {
    const clicked = await clickElement(ChatGPTSelectors.composer.attachButton);
    return {
      content: [
        {
          type: 'text',
          text: clicked
            ? 'Attach button clicked - file dialog should open'
            : 'Failed to click attach button',
        },
      ],
    };
  }
);

/**
 * Model Selection Tools
 */
server.registerTool(
  'chatgpt_open_model_selector',
  {
    description: 'Open the model selection dropdown',
    inputSchema: {},
  },
  async () => {
    const clicked = await clickElement(ChatGPTSelectors.chat.modelSwitcher);
    return {
      content: [
        {
          type: 'text',
          text: clicked ? 'Model selector opened' : 'Failed to open model selector',
        },
      ],
    };
  }
);

/**
 * Navigation Tools
 */
server.registerTool(
  'chatgpt_new_chat',
  {
    description: 'Start a new chat conversation',
    inputSchema: {},
  },
  async () => {
    const clicked = await clickElement(ChatGPTSelectors.chat.newChatButton);
    return {
      content: [
        {
          type: 'text',
          text: clicked ? 'New chat started' : 'Failed to start new chat',
        },
      ],
    };
  }
);

/**
 * Voice Tools
 */
server.registerTool(
  'chatgpt_start_voice',
  {
    description: 'Start voice input mode',
    inputSchema: {},
  },
  async () => {
    const clicked = await clickElement(ChatGPTSelectors.composer.voiceButton);
    return {
      content: [
        {
          type: 'text',
          text: clicked ? 'Voice mode activated' : 'Failed to activate voice mode',
        },
      ],
    };
  }
);

/**
 * Search Tools
 */
server.registerTool(
  'chatgpt_toggle_search',
  {
    description: 'Toggle the search feature for the current conversation',
    inputSchema: {},
  },
  async () => {
    const clicked = await clickElement(ChatGPTSelectors.composer.searchButton);
    return {
      content: [
        {
          type: 'text',
          text: clicked ? 'Search toggled' : 'Failed to toggle search',
        },
      ],
    };
  }
);

/**
 * Page State Tools
 */
server.registerTool(
  'chatgpt_get_page_state',
  {
    description: 'Get the current state of the ChatGPT page',
    inputSchema: {},
  },
  async () => {
    const state = {
      isLoggedIn: !!document.querySelector(ChatGPTSelectors.auth.profileButton),
      hasMessages: document.querySelectorAll(ChatGPTSelectors.messages.messageContainer).length > 0,
      isTyping: !!document.querySelector(ChatGPTSelectors.indicators.typingIndicator),
      currentModel:
        document.querySelector(ChatGPTSelectors.chat.modelSwitcher)?.textContent || 'Unknown',
      messageCount: document.querySelectorAll(ChatGPTSelectors.messages.messageContainer).length,
      hasModal: !!document.querySelector(ChatGPTSelectors.modals.modalContainer),
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(state, null, 2),
        },
      ],
    };
  }
);

/**
 * Modal Tools
 */
server.registerTool(
  'chatgpt_close_modal',
  {
    description: 'Close any open modal dialog',
    inputSchema: {},
  },
  async () => {
    const clicked = await clickElement(ChatGPTSelectors.auth.closeModalButton);
    return {
      content: [
        {
          type: 'text',
          text: clicked ? 'Modal closed' : 'No modal found or failed to close',
        },
      ],
    };
  }
);

/**
 * Code Block Tools
 */
server.registerTool(
  'chatgpt_get_code_blocks',
  {
    description: 'Extract all code blocks from the conversation',
    inputSchema: {},
  },
  async () => {
    const codeBlocks = document.querySelectorAll(ChatGPTSelectors.messages.codeBlock);
    const codes = Array.from(codeBlocks).map((block, index) => {
      const language = block.className.match(/language-(\w+)/)?.[1] || 'unknown';
      return `[Code Block ${index + 1} - ${language}]\n${block.textContent}`;
    });

    return {
      content: [
        {
          type: 'text',
          text: codes.length > 0 ? codes.join('\n\n---\n\n') : 'No code blocks found',
        },
      ],
    };
  }
);

/**
 * Debug Tool
 */
server.registerTool(
  'chatgpt_debug_input',
  {
    description: 'Debug the input textarea and send button state',
    inputSchema: {},
  },
  async () => {
    const textarea = document.querySelector(
      'textarea[name="prompt-textarea"]'
    ) as HTMLTextAreaElement;
    // Search for all buttons on the page
    const allButtons = Array.from(document.querySelectorAll('button'));
    const sendButtons = allButtons.filter(btn => {
      const ariaLabel = btn.getAttribute('aria-label') || '';
      const innerHTML = btn.innerHTML || '';
      const hasPath = btn.querySelector('path[d*="M4.175 10.825"]');
      const nearTextarea = textarea && btn.closest('form') === textarea.closest('form');

      return (
        ariaLabel.toLowerCase().includes('send') ||
        hasPath ||
        (nearTextarea && !btn.disabled && btn.offsetWidth > 0)
      );
    });

    const debugInfo = {
      textarea: {
        found: !!textarea,
        value: textarea?.value || '',
        valueLength: textarea?.value?.length || 0,
        placeholder: textarea?.placeholder || '',
        disabled: textarea?.disabled || false,
        readOnly: textarea?.readOnly || false,
        parentClasses: textarea?.parentElement?.className || '',
      },
      sendButtons: sendButtons.map((btn, i) => ({
        index: i,
        found: !!btn,
        disabled: (btn as HTMLButtonElement)?.disabled || false,
        ariaLabel: (btn as HTMLButtonElement)?.getAttribute('aria-label') || '',
        className: (btn as HTMLButtonElement)?.className || '',
        hasClickHandler: !!(btn as any)?.onclick,
        innerHTML: (btn as HTMLButtonElement)?.innerHTML?.substring(0, 100) || '',
      })),
      reactFiber: {
        textareaHasReactFiber:
          !!(textarea as any)?._reactInternalFiber || !!(textarea as any)?._reactInternalInstance,
        textareaReactProps: !!(textarea as any)?.__reactProps,
      },
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(debugInfo, null, 2),
        },
      ],
    };
  }
);

// Connect to transport
const transport = new TabServerTransport({
  allowedOrigins: ['*'],
});

await server.connect(transport);

console.log('[ChatGPT MCP] Server connected with tools for ChatGPT automation');
