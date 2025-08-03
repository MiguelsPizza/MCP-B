// ConsentManager.ts

export interface ConsentDecision {
  domain: string;
  granted: boolean;
  timestamp: number;
  permanent: boolean; // If true, don't ask again for this domain
}

export class ConsentManager {
  private static readonly STORAGE_KEY = 'mcp_consent_decisions';
  private static readonly PENDING_REQUESTS_KEY = 'mcp_pending_consent';

  /**
   * Check if we have consent for a domain
   */
  static async hasConsent(domain: string): Promise<boolean> {
    const decisions = await this.getConsentDecisions();
    const decision = decisions[domain];

    if (!decision) {
      return false;
    }

    // Check if decision is still valid (24h for non-permanent decisions)
    if (!decision.permanent) {
      const hoursSinceDecision = (Date.now() - decision.timestamp) / (1000 * 60 * 60);
      if (hoursSinceDecision > 24) {
        // Remove expired decision
        await this.removeConsent(domain);
        return false;
      }
    }

    return decision.granted;
  }

  /**
   * Request consent for a domain
   */
  static async requestConsent(domain: string, tabId: number, url: string): Promise<boolean> {
    // Check if we already have consent
    const existingConsent = await this.hasConsent(domain);
    if (existingConsent) {
      return true;
    }

    // Check if there's already a pending request for this domain
    const pendingRequests = await this.getPendingRequests();
    if (pendingRequests[domain]) {
      // Wait for existing request to complete
      return new Promise((resolve) => {
        const checkInterval = setInterval(async () => {
          const pending = await this.getPendingRequests();
          if (!pending[domain]) {
            clearInterval(checkInterval);
            const hasConsent = await this.hasConsent(domain);
            resolve(hasConsent);
          }
        }, 100);
      });
    }

    // Mark as pending
    await this.setPendingRequest(domain, true);

    try {
      // Show consent popup with follow-up permanence dialog
      const granted = await this.showConsentPopup(domain, tabId, url);

      return granted;
    } finally {
      // Remove from pending
      await this.setPendingRequest(domain, false);
    }
  }

  /**
   * Show consent popup to user
   */
  private static async showConsentPopup(
    domain: string,
    tabId: number,
    url: string
  ): Promise<boolean> {
    return new Promise((resolve) => {
      // Create initial notification with 2 buttons
      chrome.notifications.create(
        `mcp-consent-${domain}-${Date.now()}`,
        {
          type: 'basic',
          iconUrl: chrome.runtime.getURL('icon/48.png'),
          title: 'MCP Server Connection Request',
          message: `Website "${domain}" has an MCP server. Do you trust it to connect and access tools?`,
          buttons: [{ title: 'Deny' }, { title: 'Allow' }],
          requireInteraction: true,
        },
        (notificationId) => {
          // Handle button clicks
          const handleButtonClick = async (notificationId: string, buttonIndex: number) => {
            if (notificationId.startsWith(`mcp-consent-${domain}`)) {
              chrome.notifications.clear(notificationId);
              chrome.notifications.onButtonClicked.removeListener(handleButtonClick);
              chrome.notifications.onClosed.removeListener(handleClose);

              switch (buttonIndex) {
                case 0: // Deny
                  this.saveConsentDecision(domain, false, false);
                  resolve(false);
                  break;
                case 1: // Allow - Show follow-up dialog for permanence
                  const isPermanent = await this.showPermanenceDialog(domain);
                  this.saveConsentDecision(domain, true, isPermanent);
                  resolve(true);
                  break;
                default:
                  resolve(false);
              }
            }
          };

          const handleClose = (notificationId: string, byUser: boolean) => {
            if (notificationId.startsWith(`mcp-consent-${domain}`) && byUser) {
              chrome.notifications.onButtonClicked.removeListener(handleButtonClick);
              chrome.notifications.onClosed.removeListener(handleClose);
              // Save the denial decision when user dismisses the notification
              this.saveConsentDecision(domain, false, false);
              resolve(false); // Default to deny if closed
            }
          };

          chrome.notifications.onButtonClicked.addListener(handleButtonClick);
          chrome.notifications.onClosed.addListener(handleClose);
        }
      );
    });
  }

  /**
   * Show follow-up dialog asking about permanent consent
   */
  private static async showPermanenceDialog(domain: string): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.notifications.create(
        `mcp-permanence-${domain}-${Date.now()}`,
        {
          type: 'basic',
          iconUrl: chrome.runtime.getURL('icon/48.png'),
          title: 'Remember This Decision?',
          message: `Always allow "${domain}" to connect, or just for this session?`,
          buttons: [{ title: 'This Session Only' }, { title: 'Always Allow' }],
          requireInteraction: true,
        },
        (notificationId) => {
          // Handle button clicks
          const handleButtonClick = (notificationId: string, buttonIndex: number) => {
            if (notificationId.startsWith(`mcp-permanence-${domain}`)) {
              chrome.notifications.clear(notificationId);
              chrome.notifications.onButtonClicked.removeListener(handleButtonClick);
              chrome.notifications.onClosed.removeListener(handleClose);

              switch (buttonIndex) {
                case 0: // This Session Only
                  resolve(false); // Not permanent
                  break;
                case 1: // Always Allow
                  resolve(true); // Permanent
                  break;
                default:
                  resolve(false); // Default to session only
              }
            }
          };

          const handleClose = (notificationId: string, byUser: boolean) => {
            if (notificationId.startsWith(`mcp-permanence-${domain}`) && byUser) {
              chrome.notifications.onButtonClicked.removeListener(handleButtonClick);
              chrome.notifications.onClosed.removeListener(handleClose);
              resolve(false); // Default to session only if closed
            }
          };

          chrome.notifications.onButtonClicked.addListener(handleButtonClick);
          chrome.notifications.onClosed.addListener(handleClose);
        }
      );
    });
  }

  /**
   * Save consent decision
   */
  private static async saveConsentDecision(
    domain: string,
    granted: boolean,
    permanent: boolean
  ): Promise<void> {
    const decisions = await this.getConsentDecisions();
    decisions[domain] = {
      domain,
      granted,
      timestamp: Date.now(),
      permanent,
    };

    await chrome.storage.local.set({ [this.STORAGE_KEY]: decisions });
  }

  /**
   * Get all consent decisions
   */
  public static async getConsentDecisions(): Promise<Record<string, ConsentDecision>> {
    const result = await chrome.storage.local.get(this.STORAGE_KEY);
    return result[this.STORAGE_KEY] || {};
  }

  /**
   * Remove consent for a domain
   */
  static async removeConsent(domain: string): Promise<void> {
    const decisions = await this.getConsentDecisions();
    delete decisions[domain];
    await chrome.storage.local.set({ [this.STORAGE_KEY]: decisions });
  }

  /**
   * Get pending consent requests
   */
  private static async getPendingRequests(): Promise<Record<string, boolean>> {
    const result = await chrome.storage.local.get(this.PENDING_REQUESTS_KEY);
    return result[this.PENDING_REQUESTS_KEY] || {};
  }

  /**
   * Set pending request status
   */
  private static async setPendingRequest(domain: string, pending: boolean): Promise<void> {
    const requests = await this.getPendingRequests();
    if (pending) {
      requests[domain] = true;
    } else {
      delete requests[domain];
    }
    await chrome.storage.local.set({ [this.PENDING_REQUESTS_KEY]: requests });
  }

  /**
   * Get all consented domains
   */
  static async getConsentedDomains(): Promise<string[]> {
    const decisions = await this.getConsentDecisions();
    return Object.keys(decisions).filter((domain) => decisions[domain].granted);
  }

  /**
   * Clear all consent decisions (for settings/reset)
   */
  static async clearAllConsent(): Promise<void> {
    await chrome.storage.local.remove([this.STORAGE_KEY, this.PENDING_REQUESTS_KEY]);
  }
}
