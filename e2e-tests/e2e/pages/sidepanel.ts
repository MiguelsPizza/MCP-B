import type { Page } from '@playwright/test';

export class SidepanelPage {
  constructor(private page: Page) {}

  async waitForLoad() {
    // Wait for the React app to load
    await this.page.waitForSelector('#root', { timeout: 10000 });
    // Wait for navigation to be visible
    await this.page.waitForSelector('nav', { timeout: 5000 });
  }

  async navigateToChat() {
    // Click on the Chat link using the actual link structure
    await this.page.click('a[href="/chat"]:has-text("Chat")');
    // Wait for navigation to complete
    await this.page.waitForTimeout(500);
  }

  async navigateToMcp() {
    // Click on the MCP Server link
    await this.page.click('a[href="/mcp"]:has-text("MCP Server")');
    // Wait for navigation to complete
    await this.page.waitForTimeout(500);
  }

  async sendMessage(message: string) {
    // Wait for and fill the composer input
    const input = await this.page.waitForSelector('textarea[placeholder*="Ask about todos"]');
    await input.fill(message);
    await input.press('Enter');
  }

  async waitForResponse() {
    // Wait for assistant message - using the message role attribute
    await this.page.waitForSelector('[data-role="assistant"]', { timeout: 30000 });
  }

  async getLastAssistantMessage() {
    const messages = await this.page.locator('[data-role="assistant"]').all();
    if (messages.length === 0) return null;
    return await messages[messages.length - 1].textContent();
  }

  async getLastUserMessage() {
    const messages = await this.page.locator('[data-role="user"]').all();
    if (messages.length === 0) return null;
    return await messages[messages.length - 1].textContent();
  }

  async clickSuggestion(text: string) {
    // Click on a suggestion button that contains the text
    const suggestion = await this.page.locator(`button:has-text("${text}")`).first();
    await suggestion.click();
  }

  async expandMcpTools() {
    // Look for the collapsible trigger with MCP tools text
    const trigger = await this.page.locator('button:has-text("View all")').first();
    await trigger.click();
  }

  async waitForMcpConnection() {
    // Wait for MCP to connect - look for suggestions or tools
    await this.page.waitForSelector('button:has-text("View all todos")', { timeout: 10000 });
  }

  async isOnChatPage() {
    // Check if we're on the chat page by looking for the composer
    const composer = await this.page.locator('textarea[placeholder*="Ask about todos"]');
    return await composer.isVisible();
  }

  async isOnMcpPage() {
    // Check if we're on the MCP page
    const url = this.page.url();
    return url.includes('#/mcp');
  }
}
