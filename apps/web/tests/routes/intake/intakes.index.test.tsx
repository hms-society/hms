import { expect, test as playwrightTest, type Page } from '@playwright/test'

import { test } from '../../fixtures/auth-fixture'

import { ROUTES } from '../../../src/constants/routes'

test.beforeEach(async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
})

// Browser integration with mocked transport: these route handlers model REST states
// so this suite verifies the real middleware, route, page, and widget composition.
const BACKEND_URL = 'http://hms-api.test'
const RESPONSIBLE_ID = 'responsible-1'

const responsible = { responsibleId: RESPONSIBLE_ID, professionalName: 'Ana Ribeiro' }
const item = {
  intakeId: 'intake-1',
  displayId: 'INT-00042',
  createdAt: '2026-07-30T12:00:00.000Z',
  client: { clientId: 'client-1', name: 'Maria Oliveira', maskedTaxId: '***.982.247-**' },
  responsible,
  demandNotes: 'Verbas rescisórias',
  origin: 'direct',
  contactChannel: 'whatsapp',
  status: 'consultation_scheduled',
}

function listResponse(items = [item]) {
  return {
    items,
    page: 1,
    pageSize: 20,
    total: items.length,
    totalPages: items.length ? 1 : 0,
    statusCounts: {
      all: items.length,
      byStatus: {
        consultation_scheduled: items.length,
        consultation_completed: 0,
        viability_registered: 0,
        in_formalization: 0,
        contracted: 0,
        closed_without_contract: 0,
      },
      compatibility: { registered: 0 },
    },
  }
}

async function mockIntakeRoutes(
  page: Page,
  options: { listDelayMs?: number; failListOnce?: boolean } = {},
) {
  let shouldFailList = options.failListOnce ?? false
  let responseItems = [item]

  await page.route(`${BACKEND_URL}/**`, async (route) => {
    const request = route.request()
    const requestUrl = new URL(request.url())
    const { pathname } = requestUrl

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

    if (pathname === '/intakes/responsibles' && request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([responsible]),
      })
      return
    }

    if (pathname === '/intakes' && request.method() === 'GET') {
      if (options.listDelayMs)
        await new Promise((resolve) => setTimeout(resolve, options.listDelayMs))
      if (shouldFailList) {
        shouldFailList = false
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
        body: JSON.stringify(listResponse(responseItems)),
      })
      return
    }

    if (pathname === '/intakes/intake-1' && request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'intake-1',
          clientId: 'client-1',
          responsibleId: RESPONSIBLE_ID,
          origin: 'direct',
          contactChannel: 'whatsapp',
          demandNotes: 'Verbas rescisórias',
          status: 'consultation_scheduled',
        }),
      })
      return
    }

    if (pathname === '/intakes' && request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204 })
      return
    }

    await route.continue()
  })

  return {
    setListError(value: boolean) {
      shouldFailList = value
    },
    setEmpty() {
      responseItems = []
    },
  }
}

test('renders a stateful list, responsible filter, URL query, copy, and detail link', async ({
  page,
}) => {
  await mockIntakeRoutes(page)
  await page.goto(ROUTES.intakes)
  await expect(page.getByRole('heading', { name: 'Intakes' })).toBeVisible()
  await expect(page.getByText('Maria Oliveira')).toBeVisible()

  await page.getByLabel('Buscar intake').fill('Maria')
  await expect(page).toHaveURL(/search=Maria/)
  const filteredRequest = page.waitForRequest(
    (request) =>
      request.method() === 'GET' &&
      new URL(request.url()).pathname === '/intakes' &&
      new URL(request.url()).searchParams.get('search') === 'Maria',
  )
  await page.getByRole('button', { name: 'Filtros', exact: true }).click()
  await page.getByRole('combobox', { name: 'Responsável' }).click()
  await page.getByRole('option', { name: 'Ana Ribeiro' }).click()
  const request = await filteredRequest
  expect(new URL(request.url()).searchParams.get('responsibleId')).toBe(RESPONSIBLE_ID)
  await expect(page).toHaveURL(/responsibleId=responsible-1/)

  await page.getByRole('button', { name: 'Copiar ID INT-00042' }).click()
  await expect(page.getByRole('status')).toContainText('ID INT-00042 copiado')
  await expect(
    page.getByRole('link', { name: 'Ver detalhes de INT-00042' }),
  ).toHaveAttribute('href', /intakes\/intake-1/)
})

test('recovers from a list error without losing the current filter', async ({ page }) => {
  const state = await mockIntakeRoutes(page, { failListOnce: true })
  await page.goto(`${ROUTES.intakes}?search=Maria`)
  await expect(page.getByRole('alert')).toContainText(
    'Não foi possível carregar os intakes',
  )
  state.setListError(false)
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByText('Maria Oliveira')).toBeVisible()
  await expect(page).toHaveURL(/search=Maria/)
})

test('opens detail from the row and from the primary link with the keyboard', async ({
  page,
}) => {
  await mockIntakeRoutes(page)
  await page.goto(ROUTES.intakes)

  await page.getByText('Maria Oliveira').click()
  await expect(page).toHaveURL(/\/intakes\/intake-1$/)

  await page.goto(ROUTES.intakes)
  const primaryLink = page.getByRole('link', { name: 'INT-00042', exact: true })
  await primaryLink.focus()
  await primaryLink.press('Enter')
  await expect(page).toHaveURL(/\/intakes\/intake-1$/)
})

test('renders the empty copy and supports keyboard and narrow viewport interaction', async ({
  page,
}) => {
  const state = await mockIntakeRoutes(page)
  state.setEmpty()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(ROUTES.intakes)
  await expect(page.getByText('Ainda não há intakes', { exact: true })).toBeVisible()
  const emptyState = page.getByRole('region', { name: 'Lista de intakes' })
  const newIntakeLink = emptyState.getByRole('link', { name: 'Novo Intake' })
  await newIntakeLink.focus()
  await expect(newIntakeLink).toBeFocused()
  await expect(newIntakeLink).toBeVisible()
})

test('clears intake filters and reloads the list from a narrow viewport', async ({
  page,
}) => {
  const state = await mockIntakeRoutes(page)
  state.setEmpty()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${ROUTES.intakes}?search=INT-`)

  await page.getByRole('button', { name: 'Filtros', exact: true }).click()
  const filtersPopover = page.getByRole('dialog')
  await expect(
    filtersPopover.getByRole('button', { name: 'Limpar filtros' }),
  ).toBeVisible()
  const clearedRequest = page.waitForRequest(
    (request) =>
      request.method() === 'GET' &&
      new URL(request.url()).pathname === '/intakes' &&
      !new URL(request.url()).searchParams.has('search'),
  )

  await filtersPopover.getByRole('button', { name: 'Limpar filtros' }).click()

  await expect(page).toHaveURL(new RegExp(`${ROUTES.intakes}$`))
  await clearedRequest
})

playwrightTest(
  'redirects unauthenticated users from the protected list to login',
  async ({ page }) => {
    await page.goto(ROUTES.intakes)
    await expect(page).toHaveURL(new RegExp(`${ROUTES.login}$`))
  },
)
