import { expect, test as playwrightTest } from '@playwright/test'

import { ROUTES, buildCollaboratorDetailsPath } from '../../src/constants/routes'

import { BACKEND_URL, COLLABORATOR_ID, test } from '../fixtures/identity-fixture'

const COLLABORATOR_DETAILS_PATH = buildCollaboratorDetailsPath(COLLABORATOR_ID)

test('loads collaborator details and verifies its final dynamic URL', async ({
  page,
  identityFixture,
}) => {
  await identityFixture.mockCollaboratorRoutes()

  const detailResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'GET' &&
      response.url() === `${BACKEND_URL}/collaborators/${COLLABORATOR_ID}`,
  )

  await page.goto(COLLABORATOR_DETAILS_PATH)

  await expect(page).toHaveURL(COLLABORATOR_DETAILS_PATH)
  await expect(page.getByRole('heading', { name: 'Maria Oliveira' })).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByText('Dados de contato')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('Trabalhista')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('Contratos')).toBeVisible({ timeout: 15_000 })
  const detailResponse = await detailResponsePromise
  expect(detailResponse.status()).toBe(200)
  expect(await detailResponse.json()).toMatchObject({
    collaboratorId: COLLABORATOR_ID,
    professionalName: 'Maria Oliveira',
  })
})

playwrightTest(
  'redirects an unauthenticated user from collaborator details to login',
  async ({ page }) => {
    await page.goto(COLLABORATOR_DETAILS_PATH)

    await expect(page).toHaveURL(new RegExp(`${ROUTES.login}$`))
  },
)
