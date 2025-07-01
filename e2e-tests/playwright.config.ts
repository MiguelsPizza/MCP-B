import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',

  // Timeout for each test
  timeout: 30 * 1000,

  // Timeout for expect assertions
  expect: {
    timeout: 10 * 1000,
  },

  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: !!process.env.CI,

  // Retry on CI only.
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI.
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [['html'], ['list']],

  use: {
    // Collect trace when retrying the failed test.
    trace: 'on-first-retry',

    // Take screenshot on failure
    screenshot: 'only-on-failure',

    // Video recording
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers.
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
});
