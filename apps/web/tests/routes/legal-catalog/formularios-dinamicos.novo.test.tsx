import { expect } from '@playwright/test'

import { adminTest as test } from '../../fixtures/auth-fixture'
import { ROUTES } from '../../../src/constants/routes'

test('renders the protected new dynamic form editor and returns to the list', async ({
  page,
}) => {
  await page.route('**/legal-catalog/areas', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 'area-1', name: 'Cível', active: true }]),
    }),
  )

  await page.goto(ROUTES.newDynamicForm)
  await expect(page).toHaveURL(ROUTES.newDynamicForm)
  await expect(page.getByRole('heading', { name: 'Novo formulário' })).toBeVisible()
  await expect(page.getByText('Identificação e aplicabilidade')).toBeVisible()
  await expect(page.getByLabel('Nome do formulário *')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Adicionar campo' })).toBeVisible()
  await expect(
    page.getByText('O editor de formulários dinâmicos estará disponível em breve.'),
  ).toHaveCount(0)
  await page.getByRole('link', { name: 'Voltar para formulários' }).click()
  await expect(page).toHaveURL(`${ROUTES.dynamicForms}?page=1&pageSize=5`)
})
