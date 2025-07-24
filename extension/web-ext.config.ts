import { defineWebExtConfig } from 'wxt';

export default defineWebExtConfig({
  // Use persistent user data directory so native messaging manifests are found
  chromiumArgs: ['--user-data-dir=./.wxt/chrome-data'],
  // Set Chrome binary path from environment variable
  binaries: process.env.CHROME_PATH ? {
    chrome: process.env.CHROME_PATH,
  } : undefined,
});
