import { test, expect } from './fixtures';
import { SidepanelPage } from './pages/sidepanel';

test.describe('Extension Basic Tests', () => {
  let sidepanel: SidepanelPage;

  test.beforeEach(async ({ extensionPage }) => {
    sidepanel = new SidepanelPage(extensionPage);
    await sidepanel.waitForLoad();
  });

  test('should load extension sidepanel', async ({ extensionPage }) => {
    // Verify the sidepanel loads
    await expect(extensionPage.locator('#root')).toBeVisible();

    // Check for navigation links
    await expect(extensionPage.locator('a[href="/chat"]:has-text("Chat")')).toBeVisible();
    await expect(extensionPage.locator('a[href="/mcp"]:has-text("MCP Server")')).toBeVisible();
  });

  test('should navigate to chat page', async ({ extensionPage }) => {
    await sidepanel.navigateToChat();

    // Wait for MCP connection
    await sidepanel.waitForMcpConnection();

    // Verify chat interface is loaded
    await expect(extensionPage.locator('textarea[placeholder*="Ask about todos"]')).toBeVisible();

    // Check for suggestions
    await expect(extensionPage.locator('button:has-text("View all todos")')).toBeVisible();
  });

  test('should send a message in chat', async ({ extensionPage }) => {
    await sidepanel.navigateToChat();
    await sidepanel.waitForMcpConnection();

    // Send a simple message
    await sidepanel.sendMessage('Hello, this is a test');

    // Verify the message appears
    const userMessage = await sidepanel.getLastUserMessage();
    expect(userMessage).toContain('Hello, this is a test');

    // Wait for response
    await sidepanel.waitForResponse();
    const response = await sidepanel.getLastAssistantMessage();
    expect(response).toBeTruthy();
  });

  test('should use todo suggestions', async ({ extensionPage }) => {
    await sidepanel.navigateToChat();
    await sidepanel.waitForMcpConnection();

    // Wait for suggestions to be visible
    await extensionPage.waitForSelector('button:has-text("View all todos")', { timeout: 10000 });

    // Click on "View all todos" suggestion
    await sidepanel.clickSuggestion('View all todos');

    // Wait for response
    await sidepanel.waitForResponse();
    const response = await sidepanel.getLastAssistantMessage();
    expect(response).toBeTruthy();
  });

  test('should expand MCP tools', async ({ extensionPage }) => {
    await sidepanel.navigateToChat();
    await sidepanel.waitForMcpConnection();

    // Expand MCP tools
    await sidepanel.expandMcpTools();

    // Wait for tools to be visible
    await extensionPage.waitForTimeout(500);

    // Verify at least one tool is visible
    const tools = await extensionPage.locator('div[class*="grid"] button').count();
    expect(tools).toBeGreaterThan(0);
  });

  test('should navigate to MCP page', async ({ extensionPage }) => {
    await sidepanel.navigateToMcp();

    // Verify MCP page is loaded
    await expect(extensionPage).toHaveURL(/.*#\/mcp$/);
  });
});
