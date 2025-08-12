/**
 * ChatGPT UI Selectors for Automation
 *
 * This file contains selectors for automating ChatGPT web interface.
 * Selectors are organized by functionality and include fallback options where possible.
 *
 * @note ChatGPT uses data-testid attributes extensively, which provides reliable selectors
 * @note The UI uses Tailwind CSS classes which may change between updates
 */

export const ChatGPTSelectors = {
  /**
   * Authentication & Navigation Selectors
   */
  auth: {
    /** Main login button in the header */
    loginButton: '[data-testid="login-button"]',

    /** Mobile login button (shown on smaller screens) */
    mobileLoginButton: '[data-testid="mobile-login-button"]',

    /** Sign up button for new users */
    signupButton: '[data-testid="signup-button"]',

    /** User profile button (when logged in) */
    profileButton: '[data-testid="profile-button"]',

    /** Close button for modals/dialogs */
    closeModalButton: '[data-testid="close-button"]',
  },

  /**
   * Main Chat Interface Selectors
   */
  chat: {
    /** Main chat container */
    mainContainer: 'main',

    /** Message input textarea where users type their prompts */
    messageInput: 'textarea[name="prompt-textarea"]',
    messageInputAlt: 'textarea[placeholder*="Ask anything"]',

    /** Send message button (when visible) */
    sendButton: 'button[aria-label*="Send"]',
    sendButtonAlt1: 'button[data-testid*="send"]',
    sendButtonAlt2: 'button:has(svg path[d*="M4.175 10.825"])',

    /** Stop generation button (shown while AI is responding) */
    stopButton: 'button[aria-label*="Stop"]',

    /** New chat button/link */
    newChatButton: 'a[aria-label*="New chat"]',

    /** Model switcher dropdown */
    modelSwitcher: '[data-testid="model-switcher-dropdown-button"]',

    /** Temporary chat indicator */
    temporaryChatLabel: '[data-testid="temporary-chat-label"]',
  },

  /**
   * Message & Conversation Selectors
   */
  messages: {
    /** Individual message containers */
    messageContainer: '[data-message-author-role]',

    /** User messages */
    userMessage: '[data-message-author-role="user"]',

    /** Assistant messages */
    assistantMessage: '[data-message-author-role="assistant"]',

    /** Message content area */
    messageContent: '.prose',

    /** Code blocks in messages */
    codeBlock: 'pre code',

    /** Copy code button */
    copyCodeButton: 'button[aria-label*="Copy code"]',

    /** Message actions (edit, copy, etc.) */
    messageActions: '[class*="message-actions"]',
  },

  /**
   * Composer Actions & Tools
   */
  composer: {
    /** File upload / attachment button */
    attachButton: '[data-testid="composer-action-file-upload"]',
    attachButtonAlt: 'button[aria-label*="Add photos & files"]',

    /** Search button */
    searchButton: '[data-testid="composer-button-search"]',
    searchButtonAlt: 'button[aria-label*="Search"]',

    /** Voice input button */
    voiceButton: '[data-testid="composer-speech-button"]',
    voiceButtonAlt: 'button[aria-label*="Start voice mode"]',

    /** File input elements (hidden) */
    fileInputPhotos: 'input#upload-photos[type="file"]',
    fileInputCamera: 'input#upload-camera[type="file"]',

    /** Composer footer actions container */
    footerActions: '[data-testid="composer-footer-actions"]',

    /** Composer trailing actions container */
    trailingActions: '[data-testid="composer-trailing-actions"]',
  },

  /**
   * Quick Action / Starter Prompt Selectors
   */
  quickActions: {
    /** Container for starter prompt chips */
    starterPrompts: '[data-testid="starter-prompt-chips"]',

    /** Individual starter prompt buttons */
    analyzeDataButton: 'button[aria-label*="Analyze data"]',
    brainstormButton: 'button[aria-label*="Brainstorm"]',
    makePlanButton: 'button[aria-label*="Make a plan"]',
    helpWriteButton: 'button[aria-label*="Help me write"]',
    summarizeButton: 'button[aria-label*="Summarize text"]',

    /** More options button */
    moreButton: 'button:has-text("More")',
  },

  /**
   * Sidebar & Navigation Selectors
   */
  sidebar: {
    /** Main sidebar container */
    container: '.bg-token-sidebar-surface-primary',
    sidebarAlt: '[class*="sidebar"]',

    /** Sidebar toggle button */
    toggleButton: 'button[aria-label*="Toggle sidebar"]',

    /** Chat history items */
    chatHistoryItem: '[class*="conversation-item"]',

    /** Settings/preferences link */
    settingsLink: 'a[href*="/settings"]',
  },

  /**
   * Modal & Dialog Selectors
   */
  modals: {
    /** Generic modal/dialog container */
    modalContainer: '[role="dialog"]',

    /** Modal backdrop/overlay */
    modalBackdrop: '[class*="backdrop"]',

    /** Modal content area */
    modalContent: '[role="dialog"] > div',

    /** Confirmation buttons in modals */
    confirmButton: 'button:has-text("Confirm")',
    cancelButton: 'button:has-text("Cancel")',
  },

  /**
   * Loading & State Indicators
   */
  indicators: {
    /** Loading spinner/indicator */
    loadingSpinner: '[class*="spinner"]',

    /** Typing indicator (when AI is generating) */
    typingIndicator: '[class*="typing-indicator"]',

    /** Error message containers */
    errorMessage: '[class*="error-message"]',

    /** Success message containers */
    successMessage: '[class*="success-message"]',
  },

  /**
   * Utility Selectors
   */
  utils: {
    /** Skip to content link (accessibility) */
    skipToContent: 'a[href="#main"]',

    /** Terms of service link */
    termsLink: 'a[href*="openai.com/terms"]',

    /** Privacy policy link */
    privacyLink: 'a[href*="openai.com/privacy"]',

    /** Temporary chat checkbox (hidden) */
    temporaryChatCheckbox: 'input#temporary-chat-checkbox',
  },
};

/**
 * Helper function to wait for an element to appear
 * @param selector - The CSS selector to wait for
 * @param timeout - Maximum time to wait in milliseconds
 * @returns Promise that resolves to the element or null
 */
export async function waitForSelector(
  selector: string,
  timeout: number = 5000
): Promise<Element | null> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const element = document.querySelector(selector);
    if (element) return element;
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return null;
}

/**
 * Helper function to get element with fallback selectors
 * @param selectors - Array of selectors to try in order
 * @returns The first element found or null
 */
export function getElementWithFallback(selectors: string[]): Element | null {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) return element;
  }
  return null;
}

/**
 * Common selector patterns for dynamic content
 */
export const SelectorPatterns = {
  /** Pattern for finding elements by partial text content */
  containsText: (text: string) => `*:has-text("${text}")`,

  /** Pattern for finding elements by aria-label */
  ariaLabel: (label: string) => `[aria-label*="${label}"]`,

  /** Pattern for finding elements by data-testid */
  testId: (id: string) => `[data-testid="${id}"]`,

  /** Pattern for finding elements by placeholder text */
  placeholder: (text: string) => `[placeholder*="${text}"]`,
};

/**
 * Export default for easy importing
 */
export default ChatGPTSelectors;
