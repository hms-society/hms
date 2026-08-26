import { expect } from '@playwright/test'

import { CONSULTATION_ID, test } from '../../fixtures/document-production-fixture'

test('opens a version, preserves JSON editor content, and approves it with the real PATCH contract', async ({
  documentProduction,
  page,
}) => {
  const consoleErrors: string[] = []
  const failedRequests: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.method()} ${request.url()}`)
  })

  await page.goto(`/consultas/${CONSULTATION_ID}/documentos/document-1/versoes/version-1`)
  await expect(
    page.getByText('Contrato de prestação de serviços', { exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Conteúdo da versão 1' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Aprovar versão' })).toBeVisible()

  await page.getByRole('button', { name: 'Aprovar versão' }).click()
  await expect(page.getByRole('heading', { name: 'Aprovar versão?' })).toBeVisible()
  await page.getByRole('button', { name: 'Aprovar versão' }).last().click()

  await expect.poll(() => documentProduction.consultation.reviewRequests).toBe(1)
  expect(documentProduction.consultation.requests).toContainEqual({
    method: 'PATCH',
    path: `${'/consultations/'}${CONSULTATION_ID}/documents/document-1/versions/version-1/review`,
    body: { decision: 'approved' },
  })
  await expect(
    page.getByText(
      'A aprovação é definitiva. Selecione esta versão para torná-la vigente.',
    ),
  ).toBeVisible()
  await page.screenshot({
    path: 'test-results/consultation-document-review-approved.png',
    fullPage: true,
  })
  if (consoleErrors.length || failedRequests.length) {
    test.info().annotations.push({
      type: 'environment-diagnostic',
      description: `Fixture browser diagnostics: console=${JSON.stringify(consoleErrors)} requests=${JSON.stringify(failedRequests)}`,
    })
  }
})

test('shows a conflict without claiming the review succeeded', async ({
  documentProduction,
  page,
}) => {
  documentProduction.consultation.failNext('review', 409)
  await page.goto(`/consultas/${CONSULTATION_ID}/documentos/document-1/versoes/version-1`)

  await page.getByRole('button', { name: 'Aprovar versão' }).click()
  await page.getByRole('button', { name: 'Aprovar versão' }).last().click()

  await expect(page.getByRole('alert')).toContainText('Conflito')
  await expect(
    page.getByText('Revise o conteúdo antes de aprovar ou rejeitar esta versão.'),
  ).toBeVisible()
})
