import type { Page } from '@playwright/test';

export class McpEnabledPage {
  constructor(private page: Page) {}

  async navigateToTodoApp() {
    await this.page.goto('http://localhost:5173');
    await this.page.waitForSelector('[data-testid="todo-list"]', { timeout: 10000 });
  }

  async waitForMcpServerReady() {
    // Wait for the MCP server to be initialized on the page
    await this.page.waitForFunction(
      () => {
        return window.postMessage && document.querySelector('[data-mcp-ready]');
      },
      { timeout: 10000 }
    );
  }

  async getTodos() {
    const todos = await this.page.locator('[data-testid="todo-item"]').all();
    return Promise.all(
      todos.map(async (todo) => ({
        text: await todo.locator('[data-testid="todo-text"]').textContent(),
        completed: await todo.locator('input[type="checkbox"]').isChecked(),
      }))
    );
  }

  async addTodo(text: string) {
    await this.page.fill('input[placeholder="Add a new todo"]', text);
    await this.page.press('input[placeholder="Add a new todo"]', 'Enter');
  }

  async toggleTodo(index: number) {
    const todos = await this.page.locator('[data-testid="todo-item"]').all();
    if (todos[index]) {
      await todos[index].locator('input[type="checkbox"]').click();
    }
  }

  async deleteTodo(index: number) {
    const todos = await this.page.locator('[data-testid="todo-item"]').all();
    if (todos[index]) {
      await todos[index].locator('[data-testid="delete-todo"]').click();
    }
  }

  async openAiAssistant() {
    await this.page.click('[data-testid="ai-assistant-button"]');
    await this.page.waitForSelector('[data-testid="ai-chat-container"]');
  }

  async sendAiMessage(message: string) {
    const input = this.page.locator('[data-testid="ai-input"]');
    await input.fill(message);
    await input.press('Enter');
  }

  async getAiResponse() {
    await this.page.waitForSelector('[data-testid="ai-response"]', { timeout: 30000 });
    return await this.page.locator('[data-testid="ai-response"]').last().textContent();
  }
}
