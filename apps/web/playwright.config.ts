import { defineConfig, devices } from '@playwright/test'

const WEB_APP_URL = 'http://127.0.0.1:3100'

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
    command: 'pnpm exec vite dev --port 3100',
    url: WEB_APP_URL,
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_HMS_SERVER_APP_URL: 'http://hms-api.test',
      VITE_SUPABASE_URL: 'http://supabase.test',
      VITE_SUPABASE_KEY: 'playwright-anon-key',
    },
  },
})
