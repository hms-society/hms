import { expect, test as playwrightTest, type Page } from '@playwright/test'

import { test as authenticatedTest } from '../../fixtures/auth-fixture'

import { ROUTES } from '../../../src/constants/routes'

const BACKEND_URL = 'http://hms-api.test'
const SUPABASE_USER = {
  id: 'login-user-id',
  email: 'admin@hmsadvogados.com.br',
}

function createAuthSession() {
  const now = new Date().toISOString()

  return {
    access_token: 'login-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
    refresh_token: 'login-refresh-token',
    user: {
      id: SUPABASE_USER.id,
      aud: 'authenticated',
      role: 'authenticated',
      email: SUPABASE_USER.email,
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

async function mockLogout(page: Page) {
  await page.route('**/auth/v1/logout*', async (route) => {
    await route.fulfill({ status: 204, body: '' })
  })
}

async function mockSuccessfulAuthentication(page: Page) {
  const tokenRequestPromise = page.waitForRequest(
    (request) => request.method() === 'POST' && request.url().includes('/auth/v1/token'),
  )

  await page.route('**/auth/v1/token*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(createAuthSession()),
    })
  })
  await page.route(`${BACKEND_URL}/auth/complete-sign-in`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ collaboratorId: 'collaborator-id' }),
    })
  })

  return { tokenRequestPromise }
}

authenticatedTest(
  'redirects an authenticated user from login to home',
  async ({ page }) => {
    await page.goto(ROUTES.login)

    await expect(page).toHaveURL(new RegExp(`${ROUTES.home}$`))
    await expect(page.getByRole('heading', { name: 'Bem-vindo ao HMS' })).toBeVisible()
  },
)

playwrightTest('renders the login form for an unauthenticated user', async ({ page }) => {
  await page.goto(ROUTES.login)

  await expect(
    page.getByRole('heading', { name: 'Que bom ter você aqui.' }),
  ).toBeVisible()
  await expect(page.getByLabel('Email:')).toHaveValue('admin@hmsadvogados.com.br')
  await expect(page.getByRole('textbox', { name: 'Senha' })).toHaveValue('123456')
  await expect(page.getByRole('button', { name: 'Entrar na plataforma' })).toBeVisible()
})

playwrightTest(
  'authenticates the user and completes local sign-in before home',
  async ({ page }) => {
    const { tokenRequestPromise } = await mockSuccessfulAuthentication(page)
    await page.goto(ROUTES.login)

    await page.getByLabel('Email:').fill(SUPABASE_USER.email)
    await page.getByRole('textbox', { name: 'Senha' }).fill('123456')
    await page.getByRole('button', { name: 'Entrar na plataforma' }).click()

    const tokenRequest = await tokenRequestPromise
    expect(tokenRequest.postDataJSON()).toMatchObject({
      email: SUPABASE_USER.email,
      password: '123456',
    })
    await expect(page).toHaveURL(new RegExp(`${ROUTES.home}$`))
    await expect(page.getByRole('heading', { name: 'Bem-vindo ao HMS' })).toBeVisible()
  },
)

playwrightTest(
  'shows an authentication error and keeps the login form available',
  async ({ page }) => {
    await page.route('**/auth/v1/token*', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 400,
          error_code: 'invalid_credentials',
          msg: 'Invalid login credentials',
        }),
      })
    })
    await mockLogout(page)
    await page.goto(ROUTES.login)

    await page.getByRole('button', { name: 'Entrar na plataforma' }).click()

    await expect(page.getByRole('alert')).toContainText('Email ou senha inválidos.')
    await expect(page).toHaveURL(new RegExp(`${ROUTES.login}$`))
    await expect(page.getByRole('button', { name: 'Entrar na plataforma' })).toBeEnabled()
  },
)

playwrightTest(
  'shows the local access error after authentication succeeds',
  async ({ page }) => {
    await page.route('**/auth/v1/token*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createAuthSession()),
      })
    })
    await page.route(`${BACKEND_URL}/auth/complete-sign-in`, async (route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Conta sem acesso ativo.' }),
      })
    })
    await mockLogout(page)
    await page.goto(ROUTES.login)

    await page.getByRole('button', { name: 'Entrar na plataforma' }).click()

    await expect(page.getByRole('alert')).toContainText('Conta sem acesso ativo.')
    await expect(page).toHaveURL(new RegExp(`${ROUTES.login}$`))
  },
)
