import { test as base } from '@playwright/test'

const AUTH_STORAGE_KEY = 'sb-supabase-auth-token'

const AUTHENTICATED_USER = {
  id: '6ecbc5b0-a145-4e0c-9167-31b54fb8318c',
  email: 'attendant@hms.test',
} as const

export type AuthFixture = {
  auth: typeof AUTHENTICATED_USER
}

export const test = base.extend<AuthFixture>({
  auth: [
    async ({ page }, use) => {
      const now = new Date().toISOString()
      const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60

      await page.addInitScript(
        ({ storageKey, session }) => {
          window.localStorage.setItem(storageKey, JSON.stringify(session))
        },
        {
          storageKey: AUTH_STORAGE_KEY,
          session: {
            access_token: 'playwright-access-token',
            token_type: 'bearer',
            expires_in: 3600,
            expires_at: expiresAt,
            refresh_token: 'playwright-refresh-token',
            user: {
              id: AUTHENTICATED_USER.id,
              aud: 'authenticated',
              role: 'authenticated',
              email: AUTHENTICATED_USER.email,
              email_confirmed_at: now,
              phone: '',
              app_metadata: { provider: 'email', providers: ['email'] },
              user_metadata: {},
              identities: [],
              created_at: now,
              updated_at: now,
            },
          },
        },
      )

      await use(AUTHENTICATED_USER)
    },
    { auto: true },
  ],
})
