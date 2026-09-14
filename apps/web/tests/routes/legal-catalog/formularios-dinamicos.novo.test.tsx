import { expect } from '@playwright/test'

import { adminTest as test } from '../../fixtures/auth-fixture'
import { ROUTES } from '../../../src/constants/routes'
import { HMS_SERVER_APP_TEST_URL } from '../constants/hms-server-app-url'

test('renders the protected new dynamic form placeholder and returns to the list', async ({
  page,
}) => {
  await page.route(`${HMS_SERVER_APP_TEST_URL}/collaborators/me`, (route) =>
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

  await page.goto(ROUTES.newDynamicForm)
  await expect(page).toHaveURL(ROUTES.newDynamicForm)
  await expect(page.getByRole('heading', { name: 'Novo formulário' })).toBeVisible()
  await page.getByRole('link', { name: 'Voltar para formulários' }).click()
  await expect(page).toHaveURL(`${ROUTES.dynamicForms}?page=1&pageSize=5`)
})
