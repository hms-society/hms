import { expect, test as playwrightTest } from '@playwright/test'

import { test } from '../../fixtures/auth-fixture'
import { ROUTES } from '../../../src/constants/routes'

const BACKEND_URL = 'http://hms-api.test'

const intakePage = {
  items: [
    {
      intakeId: 'intake-1',
      displayId: 'INT-0142',
      createdAt: '2026-08-18T12:00:00.000Z',
      client: {
        clientId: 'client-1',
        name: 'Ana Beatriz',
        maskedTaxId: '***.***.***-25',
      },
      responsible: {
        responsibleId: 'responsible-1',
        professionalName: 'Marina Costa',
      },
      demandNotes: 'Orientação sobre rescisão contratual',
      origin: 'direct',
      contactChannel: 'whatsapp',
      status: 'consultation_scheduled',
    },
  ],
  page: 1,
  pageSize: 20,
  total: 1,
  totalPages: 1,
  statusCounts: {
    all: 1,
    byStatus: {
      consultation_scheduling: 0,
      consultation_scheduling_failed: 0,
      consultation_scheduled: 1,
      consultation_completed: 0,
      viability_registered: 0,
      in_formalization: 0,
      contracted: 0,
      closed_without_contract: 0,
    },
    compatibility: { registered: 0 },
  },
}

test('renders the protected intake list and sends status filters to the REST endpoint', async ({
  page,
}) => {
  await page.route(`${BACKEND_URL}/intakes/responsibles`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    })
  })

  const listRequests: string[] = []
  await page.route(`${BACKEND_URL}/intakes?*`, async (route) => {
    listRequests.push(route.request().url())
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(intakePage),
    })
  })

  await page.goto(ROUTES.intakes)

  await expect(page).toHaveURL(new RegExp(`${ROUTES.intakes}(\\?.*)?$`))
  await expect(page.getByRole('heading', { name: 'Intakes' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'ID' })).toBeVisible()
  await expect(page.getByText('INT-0142')).toBeVisible()
  const initialRequestUrl = new URL(listRequests[0])
  expect(initialRequestUrl.searchParams.get('page')).toBe('1')
  expect(initialRequestUrl.searchParams.get('pageSize')).toBe('20')

  await page.getByRole('tab', { name: /Consulta agendada/ }).click()

  await expect(page).toHaveURL(/status=consultation_scheduled/)
  await expect(page.getByText('Ana Beatriz')).toBeVisible()
  expect(listRequests.at(-1)).toContain('status=consultation_scheduled')
})

playwrightTest(
  'redirects unauthenticated users from the intake list to login',
  async ({ page }) => {
    await page.goto(ROUTES.intakes)

    await expect(page).toHaveURL(new RegExp(`${ROUTES.login}$`))
  },
)
