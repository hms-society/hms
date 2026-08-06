import { expect } from '@playwright/test'
import { test } from '../../fixtures/auth-fixture'
import { ROUTES } from '../../../src/constants/routes'
import {
  DOCUMENT_PRODUCTION_BACKEND,
  createStatefulDocumentSpecificationRoutes,
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
  await expect(page.getByRole('columnheader', { name: 'Ação' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Novo modelo' })).toHaveAttribute(
    'href',
    ROUTES.newDocumentSpecification,
  )
  await expect(page.getByRole('link', { name: 'Editar Procuração' })).toHaveAttribute(
    'href',
    '/modelos-de-documentos/spec-1',
  )
  const request = await requestPromise
  expect(new URL(request.url()).searchParams.get('search')).toBe('Procuração')
})

test('navigates to create without POST and follows the 201 replace redirect', async ({
  page,
}) => {
  const state = await createStatefulDocumentSpecificationRoutes(page)
  const postRequests: string[] = []
  page.on('request', (request) => {
    if (request.method() === 'POST') postRequests.push(request.url())
  })

  await page.goto(ROUTES.documentSpecifications)
  await page.getByRole('link', { name: 'Novo modelo' }).click()
  await expect(page).toHaveURL(ROUTES.newDocumentSpecification)
  await page.getByLabel('Nome').fill('Contrato de honorários')
  await page.getByLabel('Descrição').fill('Modelo de contrato')
  await page.getByRole('button', { name: 'Criar modelo' }).click()
  await expect(page).toHaveURL('/modelos-de-documentos/created-specification')
  expect(state.createRequests).toBe(1)
  expect(postRequests).toHaveLength(1)
})

test('navigates to edit, preserves filters, and patches once after a dirty change', async ({
  page,
}) => {
  const state = await createStatefulDocumentSpecificationRoutes(page)
  await page.goto(
    `${ROUTES.documentSpecifications}?legalAreaId=area-1&legalTopicId=topic-1&status=available`,
  )
  await page.getByRole('link', { name: 'Editar Procuração' }).click()
  await expect(page).toHaveURL('/modelos-de-documentos/spec-1')
  await expect(page.getByLabel('Nome')).toHaveValue('Procuração')
  expect(state.getRequests).toBe(1)
  await page.getByLabel('Nome').fill('Procuração atualizada')
  await page.getByRole('button', { name: 'Salvar modelo' }).click()
  await expect(page.getByLabel('Nome')).toHaveValue('Procuração atualizada')
  expect(state.patchRequests).toBe(1)
})
