import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import puppeteer, { Browser, Page } from 'puppeteer';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Gmail MCP-B Integration Tests', () => {
  let browser: Browser;
  let page: Page;
  let scriptContent: string;

  beforeAll(async () => {
    // Launch browser
    browser = await puppeteer.launch({
      headless: process.env.CI === 'true', // Run headless in CI, with UI locally
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    // Load the built userscript
    try {
      scriptContent = readFileSync(join(__dirname, '../scripts/gmail/dist/gmail.user.js'), 'utf8');
    } catch (error) {
      // If dist doesn't exist, try to use source with a mock
      console.warn('Built script not found, using mock for testing');
      scriptContent = `
        window.mcp = {
          registerTool: () => {},
          getTool: () => undefined,
          listTools: () => [],
          isInitialized: () => true,
        };
        console.log('Mock MCP-B initialized');
      `;
    }
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    page = await browser.newPage();

    // Set viewport
    await page.setViewport({ width: 1280, height: 720 });

    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('[MCP-B]')) {
        console.log('Browser:', msg.text());
      }
    });
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  test('should inject MCP-B into Gmail demo page', async () => {
    // Create a simple Gmail-like demo page
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Gmail Test</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .inbox { border: 1px solid #ccc; padding: 10px; margin: 10px 0; }
          .compose-btn { background: #4285f4; color: white; padding: 10px; border: none; cursor: pointer; }
        </style>
      </head>
      <body>
        <h1>Gmail Test Page</h1>
        <div role="main">
          <button class="compose-btn" gh="cm">Compose</button>
          <div class="inbox">
            <tbody>
              <tr>
                <td><span data-thread-id="1">Test Email Subject</span></td>
                <td><span email="test@example.com">test@example.com</span></td>
              </tr>
            </tbody>
          </div>
        </div>
      </body>
      </html>
    `;

    await page.setContent(htmlContent);

    // Inject our userscript
    await page.evaluate(scriptContent);

    // Wait for MCP to be initialized
    await page.waitForFunction(() => window.mcp?.isInitialized?.(), { timeout: 5000 });

    // Verify MCP-B is initialized
    const mcpInitialized = await page.evaluate(() => {
      return window.mcp?.isInitialized() || false;
    });

    expect(mcpInitialized).toBe(true);
  });

  test('should register Gmail MCP tools', async () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head><title>Gmail Test</title></head>
      <body>
        <div role="main">
          <div gh="cm">Compose</div>
          <tbody><tr><td><span data-thread-id="1">Test</span></td></tr></tbody>
        </div>
      </body>
      </html>
    `;

    await page.setContent(htmlContent);
    await page.evaluate(scriptContent);

    // Wait for tools to be registered
    await page.waitForFunction(
      () => {
        return window.mcp?.listTools().length > 0;
      },
      { timeout: 10000 }
    );

    const tools = await page.evaluate(() => {
      return window.mcp?.listTools() || [];
    });

    expect(tools).toContain('compose_email');
    expect(tools).toContain('list_inbox_emails');
    expect(tools).toContain('read_current_email');
    expect(tools).toContain('search_emails');
  });

  test('should handle compose email tool', async () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head><title>Gmail Test</title></head>
      <body>
        <div role="main">
          <div gh="cm">Compose</div>
          <div role="dialog" style="display: none;">
            <textarea name="to"></textarea>
            <input name="subjectbox">
            <div contenteditable="true" role="textbox"></div>
            <div role="button" data-tooltip="Send">Send</div>
          </div>
        </div>
        <script>
          // Mock Gmail compose behavior
          document.querySelector('[gh="cm"]').addEventListener('click', () => {
            document.querySelector('[role="dialog"]').style.display = 'block';
          });
        </script>
      </body>
      </html>
    `;

    await page.setContent(htmlContent);
    await page.evaluate(scriptContent);

    // Wait for MCP to be ready
    await page.waitForFunction(() => window.mcp?.isInitialized(), { timeout: 5000 });

    // Test compose email tool
    const result = await page.evaluate(async () => {
      const tool = window.mcp?.getTool('compose_email');
      if (!tool) return { error: 'Tool not found' };

      return await tool.handler({
        to: ['test@example.com'],
        subject: 'Test Subject',
        body: 'Test body content',
      });
    });

    expect(result).toHaveProperty('success');
    expect(result.success).toBe(true);
  });

  test('should handle list emails tool', async () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head><title>Gmail Test</title></head>
      <body>
        <div role="main">
          <tbody>
            <tr>
              <td><span data-thread-id="1">Email 1 Subject</span></td>
              <td><span email="sender1@example.com">sender1@example.com</span></td>
            </tr>
            <tr>
              <td><span data-thread-id="2">Email 2 Subject</span></td>
              <td><span email="sender2@example.com">sender2@example.com</span></td>
            </tr>
          </tbody>
        </div>
      </body>
      </html>
    `;

    await page.setContent(htmlContent);
    await page.evaluate(scriptContent);

    await page.waitForFunction(() => window.mcp?.isInitialized(), { timeout: 5000 });

    const emails = await page.evaluate(async () => {
      const tool = window.mcp?.getTool('list_inbox_emails');
      if (!tool) return [];

      return await tool.handler({ limit: 5 });
    });

    expect(Array.isArray(emails)).toBe(true);
    expect(emails.length).toBeGreaterThan(0);

    if (emails.length > 0) {
      expect(emails[0]).toHaveProperty('subject');
      expect(emails[0]).toHaveProperty('from');
      expect(emails[0]).toHaveProperty('id');
    }
  });

  test('should be resilient to DOM changes', async () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head><title>Gmail Test</title></head>
      <body>
        <div role="main">
          <div id="initial-content">Initial content</div>
        </div>
      </body>
      </html>
    `;

    await page.setContent(htmlContent);
    await page.evaluate(scriptContent);

    // Simulate DOM changes (like Gmail navigation)
    await page.evaluate(() => {
      const main = document.querySelector('[role="main"]');
      if (main) {
        main.innerHTML = `
          <div gh="cm">Compose</div>
          <tbody><tr><td><span data-thread-id="1">New Email</span></td></tr></tbody>
        `;
      }
    });

    // Wait a bit for any re-initialization
    await page.waitForTimeout(2000);

    const mcpStillWorking = await page.evaluate(() => {
      return window.mcp?.isInitialized() || false;
    });

    expect(mcpStillWorking).toBe(true);
  });
});
