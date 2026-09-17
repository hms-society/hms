import { expect } from '@playwright/test'

import { adminTest as test } from '../../fixtures/auth-fixture'
import { ROUTES } from '../../../src/constants/routes'

const BACKEND_URL = 'http://hms-api.test'

test('renders the protected existing dynamic form placeholder with its UUID route', async ({
  page,
}) => {
  await page.route(`${BACKEND_URL}/collaborators/me`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        collaboratorId: 'admin',
        professionalName: 'Admin',
        email: 'admin@hms.test',
        profile: 'admin',
        status: 'active',
      }),
    }),
  )
  const dynamicFormId = '11111111-1111-4111-8111-111111111111'
  await page.goto(ROUTES.dynamicForm.replace('$dynamicFormId', dynamicFormId))
  await expect(page).toHaveURL(
    ROUTES.dynamicForm.replace('$dynamicFormId', dynamicFormId),
  )
  await expect(page.getByRole('heading', { name: 'Editar formulário' })).toBeVisible({
    timeout: 15_000,
  })
  await page.getByRole('link', { name: 'Voltar para formulários' }).click()
  await expect(page).toHaveURL(`${ROUTES.dynamicForms}?page=1&pageSize=5`)
})
