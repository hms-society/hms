import { expect, test as playwrightTest, type Page } from '@playwright/test'

import { test } from '../../fixtures/auth-fixture'

import { ROUTES } from '../../../src/constants/routes'

// Browser integration with mocked transport: only this route suite mocks REST;
// it still executes the real protected route and detail-page composition.
const BACKEND_URL = 'http://hms-api.test'
const INTAKE_ID = 'intake-1'

const intake = {
  id: INTAKE_ID,
  sequenceNumber: 42,
  clientId: 'client-1',
  responsibleId: 'responsible-1',
  createdBy: 'attendant-1',
  updatedBy: 'attendant-1',
  origin: 'direct',
  contactChannel: 'whatsapp',
  legalAreaId: 'area-1',
  legalTopicId: 'topic-1',
  urgency: 'normal',
  demandNotes: 'Verbas rescisórias',
  status: 'consultation_scheduled',
  version: 1,
  createdAt: '2026-07-30T12:00:00.000Z',
  updatedAt: '2026-07-30T12:00:00.000Z',
}

async function mockDetailRoutes(
  page: Page,
  options: { failOnce?: boolean; delayMs?: number } = {},
) {
  let shouldFail = options.failOnce ?? false
  await page.route(`${BACKEND_URL}/**`, async (route) => {
    const request = route.request()
    const { pathname } = new URL(request.url())
    if (pathname === '/collaborators/me' && request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          collaboratorId: 'admin-1',
          professionalName: 'Administrador HMS',
          email: 'admin@hms.test',
          profile: 'admin',
          status: 'active',
          legalExpertises: [],
        }),
      })
      return
    }
    if (pathname === `/intakes/${INTAKE_ID}` && request.method() === 'GET') {
      if (options.delayMs)
        await new Promise((resolve) => setTimeout(resolve, options.delayMs))
      if (shouldFail) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'temporary failure' }),
        })
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(intake),
      })
      return
    }
    await route.continue()
  })

  return {
    setError(value: boolean) {
      shouldFail = value
    },
  }
}

test('loads the dynamic intake detail and preserves the requested id', async ({
  page,
}) => {
  await mockDetailRoutes(page)
  await page.goto(`/intakes/${INTAKE_ID}`)
  await expect(page).toHaveURL(
    new RegExp(`${ROUTES.intakeDetails.replace('$intakeId', INTAKE_ID)}$`),
  )
  await expect(page.getByRole('heading', { name: 'Detalhe do intake' })).toBeVisible()
  await expect(page.getByText(INTAKE_ID, { exact: true })).toBeVisible()
  await expect(page.getByText('responsible-1')).toBeVisible()
  await expect(page.getByText('WhatsApp')).toBeVisible()
  await expect(page.getByText('Verbas rescisórias')).toBeVisible()
})

test('recovers from a detail error and exposes the back navigation', async ({ page }) => {
  const state = await mockDetailRoutes(page, { failOnce: true })
  await page.goto(`/intakes/${INTAKE_ID}`)
  await expect(page.getByRole('alert')).toContainText(
    'Não foi possível carregar o intake',
  )
  state.setError(false)
  await page.getByRole('button', { name: 'Tentar novamente' }).press('Enter')
  await expect(page.getByRole('heading', { name: 'Detalhe do intake' })).toBeVisible()
  await expect(page.getByRole('link', { name: /voltar para intakes/i })).toBeVisible()
})

test('shows a pending state at a narrow viewport', async ({ page }) => {
  await mockDetailRoutes(page, { delayMs: 500 })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/intakes/${INTAKE_ID}`)
  await expect(page.getByRole('status', { name: /carregando detalhe/i })).toBeVisible()
  await expect(page.getByRole('status', { name: /carregando detalhe/i })).toBeVisible()
})

playwrightTest(
  'redirects unauthenticated users from the protected detail route to login',
  async ({ page }) => {
    await page.goto(`/intakes/${INTAKE_ID}`)
    await expect(page).toHaveURL(new RegExp(`${ROUTES.login}$`))
  },
)
