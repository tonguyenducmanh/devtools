import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test/generated',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'test/playwright-report' }]],
  outputDir: 'test/test-results',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    headless: false,
    contextOptions: {
      permissions: ['clipboard-read', 'clipboard-write']
    }
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
