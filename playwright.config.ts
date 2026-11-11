import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  testMatch: ['**/archive.spec.ts', '**/player.spec.ts'],
  fullyParallel: true,
  retries: 0,
  workers: 3,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    ...(process.env.ARCHIVE_FIXTURE_URL
      ? [
          {
            name: 'content-fixture',
            testMatch: ['**/fixtures.spec.ts'],
            use: {
              ...devices['Desktop Chrome'],
              baseURL: process.env.ARCHIVE_FIXTURE_URL,
              launchOptions: { executablePath: process.env.CHROMIUM_EXECUTABLE },
            },
          },
        ]
      : []),
    {
      name: 'desktop-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 1000 },
        launchOptions: { executablePath: process.env.CHROMIUM_EXECUTABLE },
      },
    },
    {
      name: 'mobile-landscape',
      use: {
        ...devices['iPhone 13 landscape'],
        defaultBrowserType: 'chromium',
        viewport: { width: 844, height: 390 },
        launchOptions: { executablePath: process.env.CHROMIUM_EXECUTABLE },
      },
    },
    {
      name: 'mobile-portrait',
      use: {
        ...devices['iPhone 13'],
        defaultBrowserType: 'chromium',
        viewport: { width: 390, height: 844 },
        launchOptions: { executablePath: process.env.CHROMIUM_EXECUTABLE },
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 900 },
        launchOptions: process.env.WEBKIT_EXECUTABLE
          ? { executablePath: process.env.WEBKIT_EXECUTABLE }
          : undefined,
      },
    },
  ],
});
