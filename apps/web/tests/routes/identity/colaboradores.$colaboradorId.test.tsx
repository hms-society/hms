import { expect, test as playwrightTest } from '@playwright/test'

import { test } from '../../fixtures/auth-fixture'

import { ROUTES } from '../../../src/constants/routes'

import {
  BACKEND_URL,
  COLLABORATOR_ID,
  mockCollaboratorRoutes,
} from './colaboradores-test-helpers'

test('loads collaborator details and verifies its final dynamic URL', async ({
  page,
}) => {
  await mockCollaboratorRoutes(page)

  const detailRequestPromise = page.waitForRequest(
    (request) =>
      request.method() === 'GET' &&
      request.url() === `${BACKEND_URL}/collaborators/${COLLABORATOR_ID}`,
  )

  await page.goto(`/colaboradores/${COLLABORATOR_ID}`)

  await expect(page).toHaveURL(`/colaboradores/${COLLABORATOR_ID}`)
  await expect(page.getByRole('heading', { name: 'Maria Oliveira' })).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByText('Dados de contato')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('Trabalhista')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('Contratos')).toBeVisible({ timeout: 15_000 })
  await detailRequestPromise
})

playwrightTest(
  'redirects an unauthenticated user from collaborator details to login',
  async ({ page }) => {
    await page.goto(`/colaboradores/${COLLABORATOR_ID}`)

    await expect(page).toHaveURL(new RegExp(`${ROUTES.login}$`))
  },
)
