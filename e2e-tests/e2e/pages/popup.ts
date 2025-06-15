import { type Page } from '@playwright/test';

export async function openPopup(page: Page, extensionId: string) {
  await page.goto(`chrome-extension://${extensionId}/sidepannel.html`);

  await page.waitForSelector('#counter');

  const popup = {
    getCounter: () => page.waitForSelector('#counter'),
    clickCounter: async () => {
      const counter = await popup.getCounter();
      await counter.click();
    },
    getCounterText: async () => {
      const counter = await popup.getCounter();
      return await counter.evaluate((el) => el.textContent);
    },
  };
  return popup;
}
