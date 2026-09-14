import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // output: 'standalone' ile 'next start' çalışmaz; CI'daki gibi paketlenmiş sunucuyu kullan
    command: 'node scripts/prepare-standalone.mjs && node .next/standalone/server.js',
    url: 'http://localhost:3100',
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      PORT: '3100',
      HOSTNAME: '127.0.0.1',
    },
  },
});
