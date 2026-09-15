import { test as base } from '@playwright/test'

const AUTH_STORAGE_KEY = 'sb-supabase-auth-token'

const AUTHENTICATED_USER = {
  id: '6ecbc5b0-a145-4e0c-9167-31b54fb8318c',
  email: 'attendant@hms.test',
} as const

const ADMIN_USER = {
  id: '6ecbc5b0-a145-4e0c-9167-31b54fb8318c',
  email: 'admin@hms.test',
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

export type AdminAuthFixture = {
  authenticated: typeof ADMIN_USER
}

export const adminTest = base.extend<AdminAuthFixture>({
  authenticated: [
    async ({ page }, use) => {
      const now = new Date().toISOString()
      const session = createSession(ADMIN_USER, now)

      await page.route('**/auth/v1/token?grant_type=password', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(session),
        })
      })
      await page.route('**/auth/complete-sign-in', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            collaboratorId: 'admin',
            professionalName: 'Admin',
            email: ADMIN_USER.email,
            profile: 'admin',
            status: 'active',
          }),
        })
      })
      await page.route('**/collaborators/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            collaboratorId: 'admin',
            professionalName: 'Admin',
            email: ADMIN_USER.email,
            profile: 'admin',
            status: 'active',
          }),
        })
      })

      await page.goto('/login')
      await page.getByLabel('Email:').fill(ADMIN_USER.email)
      await page.getByRole('textbox', { name: 'Senha' }).fill('playwright-password')
      await page.getByRole('button', { name: 'Entrar na plataforma' }).click()
      await page.waitForURL('**/home')

      await use(ADMIN_USER)
    },
    { auto: true, scope: 'test' },
  ],
})

function createSession(user: typeof ADMIN_USER, now: string) {
  return {
    access_token: 'playwright-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'playwright-refresh-token',
    user: {
      id: user.id,
      aud: 'authenticated',
      role: 'authenticated',
      email: user.email,
      email_confirmed_at: now,
      phone: '',
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: {},
      identities: [],
      created_at: now,
      updated_at: now,
    },
  }
}
