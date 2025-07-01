import { test, expect } from './fixtures';
import { SidepanelPage } from './pages/sidepanel';

test.describe('MCP Integration Tests', () => {
  let sidepanel: SidepanelPage;
  let todoPage: any;

  test.beforeEach(async ({ extensionPage, context }) => {
    sidepanel = new SidepanelPage(extensionPage);

    // Open a new tab with the todo app
    todoPage = await context.newPage();
    await todoPage.goto('http://localhost:5173');

    // Wait for the page to load
    await todoPage.waitForLoadState('networkidle');

    // Wait for sidepanel to load
    await sidepanel.waitForLoad();
    await sidepanel.navigateToChat();

    // Wait for MCP discovery
    await sidepanel.waitForMcpConnection();
  });

  test('should discover MCP server from todo app', async ({ extensionPage }) => {
    // Expand MCP tools to see available tools
    await sidepanel.expandMcpTools();

    // Wait for tools to be visible
    await extensionPage.waitForTimeout(500);

    // Verify we have tools available
    const tools = await extensionPage.locator('div[class*="grid"] button').count();
    expect(tools).toBeGreaterThan(0);
  });

  test('should create a todo using MCP tools', async ({ extensionPage }) => {
    // Send a message to create a todo
    await sidepanel.sendMessage('Create a new todo called "Test todo from E2E"');

    // Wait for response
    await sidepanel.waitForResponse();

    // Verify the response mentions the todo was created
    const response = await sidepanel.getLastAssistantMessage();
    expect(response?.toLowerCase()).toMatch(/created|added|new todo/);

    // Check the todo page to verify it was created
    await todoPage.reload();
    await todoPage.waitForTimeout(1000);
    const todoExists = await todoPage.locator('text="Test todo from E2E"').count();
    expect(todoExists).toBeGreaterThan(0);
  });

  test('should list todos using MCP tools', async ({ extensionPage }) => {
    // Use the "View all todos" suggestion
    await extensionPage.waitForSelector('button:has-text("View all todos")', { timeout: 10000 });
    await sidepanel.clickSuggestion('View all todos');

    // Wait for response
    await sidepanel.waitForResponse();

    // Verify the response contains todo information
    const response = await sidepanel.getLastAssistantMessage();
    expect(response).toBeTruthy();
    expect(response?.toLowerCase()).toMatch(/todo|task|item|list|showing/);
  });

  test('should handle multiple MCP tool calls', async ({ extensionPage }) => {
    // Send a complex request
    await sidepanel.sendMessage(
      'Create two todos: "First task" and "Second task", then list all todos'
    );

    // Wait for response (might take longer for multiple operations)
    await sidepanel.waitForResponse();
    await extensionPage.waitForTimeout(2000); // Extra wait for multiple tool calls

    // Verify the response mentions both todos
    const response = await sidepanel.getLastAssistantMessage();
    expect(response).toBeTruthy();

    // Check if todos were created on the page
    await todoPage.reload();
    await todoPage.waitForTimeout(1000);
    const firstExists = await todoPage.locator('text="First task"').count();
    const secondExists = await todoPage.locator('text="Second task"').count();
    expect(firstExists).toBeGreaterThan(0);
    expect(secondExists).toBeGreaterThan(0);
  });
});
