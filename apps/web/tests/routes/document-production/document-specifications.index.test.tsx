import { expect } from '@playwright/test'
import { test } from '../../fixtures/auth-fixture'
import { ROUTES } from '../../../src/constants/routes'
import {
  DOCUMENT_PRODUCTION_BACKEND,
  mockDocumentSpecificationRoutes,
} from './document-specifications-test-helpers'

test('renders the protected document specifications route and preserves the API query contract', async ({
  page,
}) => {
  await mockDocumentSpecificationRoutes(page)
  const requestPromise = page.waitForRequest(
    (request) =>
      request.method() === 'GET' &&
      request.url().startsWith(`${DOCUMENT_PRODUCTION_BACKEND}/document-specifications`),
  )
  const expectedUrl = `${ROUTES.documentSpecifications}?search=Procura%C3%A7%C3%A3o&page=1&pageSize=20`
  await page.goto(expectedUrl)
  await expect(page).toHaveURL(expectedUrl)
  await expect(page.getByRole('heading', { name: 'Modelos de documentos' })).toBeVisible()
  await expect(page.getByText('Procuração')).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Modelo' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Aplicação' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Obrigatoriedade' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Estado' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Atualizado' })).toHaveCount(0)
  await expect(page.getByRole('columnheader', { name: 'Ação' })).toHaveCount(0)
  const request = await requestPromise
  expect(new URL(request.url()).searchParams.get('search')).toBe('Procuração')
})
