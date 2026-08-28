import { defineConfig, devices } from '@playwright/test'

const WEB_APP_URL = process.env.PLAYWRIGHT_WEB_APP_URL ?? 'http://127.0.0.1:5000'
const WEB_APP_PORT = new URL(WEB_APP_URL).port

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.test.tsx',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: WEB_APP_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `pnpm exec vite dev --host 127.0.0.1 --port ${WEB_APP_PORT}`,
    url: WEB_APP_URL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_HMS_SERVER_APP_URL: 'http://hms-api.test',
      VITE_SUPABASE_URL: 'http://supabase.test',
      VITE_SUPABASE_KEY: 'playwright-anon-key',
    },
  },
})
