import { defineConfig, devices } from '@playwright/test'
import { loadEnv } from 'vite'

const env = { ...loadEnv('test', process.cwd(), ''), ...process.env }
const webAppPort = Number(env.HMS_WEB_APP_PORT || 5000)

if (!Number.isInteger(webAppPort) || webAppPort < 1 || webAppPort > 65535) {
  throw new Error('HMS_WEB_APP_PORT must be an integer between 1 and 65535.')
}

const webAppUrl = env.PLAYWRIGHT_WEB_APP_URL ?? `http://127.0.0.1:${webAppPort}`

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.test.tsx',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: webAppUrl,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm exec vite dev --host 127.0.0.1',
    url: webAppUrl,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: {
      HMS_WEB_APP_PORT: String(webAppPort),
      VITE_HMS_SERVER_APP_URL: 'http://hms-api.test',
      VITE_SUPABASE_URL: 'http://supabase.test',
      VITE_SUPABASE_KEY: 'playwright-anon-key',
    },
  },
})
