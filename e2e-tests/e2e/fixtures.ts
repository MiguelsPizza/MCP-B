import path from 'path';
import { test as base, chromium, type BrowserContext, type Page } from '@playwright/test';

// Path to the built extension
const pathToExtension = path.resolve('../extension/.output/chrome-mv3');

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
  extensionPage: Page;
}>({
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    // Wait for service worker to be ready
    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent('serviceworker');
    }

    const extensionId = background.url().split('/')[2];
    await use(extensionId);
  },
  extensionPage: async ({ context, extensionId }, use) => {
    // Create a new tab to test with
    const page = await context.newPage();
    
    // Open the extension sidebar by clicking the extension icon
    // First, navigate to a page (Chrome requires a page to be open)
    await page.goto('https://example.com');
    
    // Click on the extension icon in the toolbar
    // Note: This is tricky with Playwright, so we'll open the sidepanel directly
    // In a real user flow, they would click the extension icon
    await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
    
    await use(page);
  },
});

export const expect = test.expect;
