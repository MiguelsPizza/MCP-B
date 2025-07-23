import { defineWebExtConfig } from 'wxt';

export default defineWebExtConfig({
  // Use persistent user data directory so native messaging manifests are found
  chromiumArgs: ['--user-data-dir=./.wxt/chrome-data'],
  // Optional: Set Chrome for Testing binary if available
  // binaries: {
  //   chrome: '/Applications/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  // },
});
