import { expect } from '@playwright/test'

import { adminTest as test } from '../../fixtures/auth-fixture'
import { ROUTES } from '../../../src/constants/routes'

test('renders the protected existing dynamic form editor with its UUID route', async ({
  page,
}) => {
  const dynamicFormId = '11111111-1111-4111-8111-111111111111'
  await page.route('**/legal-catalog/areas', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 'area-1', name: 'Cível', active: true }]),
    }),
  )
  await page.route('**/legal-catalog/areas/area-1/topics', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 'topic-1', name: 'Contratos', active: true }]),
    }),
  )
  await page.route(`**/legal-catalog/dynamic-forms/${dynamicFormId}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        form: {
          id: dynamicFormId,
          name: 'Triagem inicial',
          description: 'Dados da consulta',
          status: 'available',
          stage: 'consultation',
          version: 1,
          legalAreaId: 'area-1',
          legalTopicIds: ['topic-1'],
          fields: [
            {
              id: 'field-1',
              key: 'facts',
              label: 'Fatos',
              type: 'long_text',
              required: true,
            },
          ],
        },
        legalArea: { id: 'area-1', name: 'Cível' },
        legalTopics: [{ id: 'topic-1', name: 'Contratos', position: 0 }],
      }),
    }),
  )

  await page.goto(ROUTES.dynamicForm.replace('$dynamicFormId', dynamicFormId))
  await expect(page).toHaveURL(
    ROUTES.dynamicForm.replace('$dynamicFormId', dynamicFormId),
  )
  await expect(page.getByRole('heading', { name: 'Triagem inicial' })).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByLabel('Nome do formulário *')).toHaveValue('Triagem inicial')
  await expect(page.getByText('Fatos', { exact: true })).toBeVisible()
  await expect(
    page.getByText('O editor de formulários dinâmicos estará disponível em breve.'),
  ).toHaveCount(0)
  await page.getByRole('link', { name: 'Voltar para formulários' }).click()
  await expect(page).toHaveURL(`${ROUTES.dynamicForms}?page=1&pageSize=5`)
})
