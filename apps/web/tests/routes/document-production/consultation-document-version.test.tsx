import { expect } from '@playwright/test'

import { CONSULTATION_ID, test } from '../../fixtures/document-production-fixture'

test('blocks approval with pending markers and explains how to resolve them [mocked]', async ({
  documentProduction,
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.route('**/communications/summary', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )
  await page.goto(`/consultas/${CONSULTATION_ID}/documentos/document-1/versoes/version-1`)
  await expect(page.getByRole('button', { name: 'Aprovar versão' })).toBeDisabled({
    timeout: 20_000,
  })
  await expect(
    page.getByText('Resolva as pendências do documento antes de aprovar esta versão.'),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Rejeitar versão' })).toBeEnabled()
  await page.getByRole('button', { name: 'Pendências (1)' }).press('Enter')
  await expect(
    page.getByRole('dialog', { name: 'Pendências do documento' }),
  ).toBeVisible()
  await expect(page.getByText('{client_name}', { exact: true })).toBeVisible()
  expect(documentProduction.consultation.reviewRequests).toBe(0)
})

test('links the reviewed document to its corresponding template [mocked]', async ({
  documentProduction,
  page,
}) => {
  expect(documentProduction.consultation.documents[0].documentSpecificationId).toBe(
    'spec-1',
  )
  await page.setViewportSize({ width: 390, height: 844 })
  await page.route('**/communications/summary', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )
  await page.goto(`/consultas/${CONSULTATION_ID}/documentos/document-1/versoes/version-1`)
  await expect(page.getByRole('link', { name: 'Ver modelo' })).toHaveAttribute(
    'href',
    '/modelos-de-documentos/spec-1',
  )
  await page.getByRole('link', { name: 'Ver modelo' }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/modelos-de-documentos\/spec-1$/)
  await expect(page.getByRole('heading', { name: 'Procuração' })).toBeVisible()
})

test('opens the generated version and its content after regeneration completes [mocked]', async ({
  documentProduction,
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const browserErrors: string[] = []
  page.on('pageerror', (error) => browserErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text())
  })
  await page.route('**/communications/summary', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )
  const document = documentProduction.consultation.documents[0]
  document.generationStatus = 'completed'
  document.currentVersionId = 'version-1'
  document.versions[0].status = 'approved'
  documentProduction.consultation.versions['version-1'].status = 'approved'
  await page.goto(`/consultas/${CONSULTATION_ID}/documentos/document-1/versoes/version-1`)
  await page.getByRole('button', { name: 'Gerar nova versão' }).click()
  await page
    .getByRole('textbox', { name: 'Instruções para a nova versão' })
    .fill('escreva em alemão')
  await page
    .getByRole('alertdialog', { name: 'Gerar nova versão' })
    .getByRole('button', { name: 'Gerar nova versão' })
    .press('Enter')
  await expect(page.getByText('Gerando', { exact: true })).toBeVisible()
  const generatedVersion: (typeof documentProduction.consultation.versions)[string] = {
    ...documentProduction.consultation.versions['version-1'],
    id: 'generated-version-2',
    versionNumber: 2,
    status: 'in_review' as const,
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { textAlign: null },
          content: [{ type: 'text', text: 'Vollmacht für den Mandanten.' }],
        },
      ],
    } as unknown as (typeof documentProduction.consultation.versions)[string]['content'],
  }
  documentProduction.consultation.versions[generatedVersion.id] = generatedVersion
  document.versions.push({
    ...document.versions[0],
    id: generatedVersion.id,
    versionNumber: 2,
    status: 'in_review',
  })
  await expect(page).toHaveURL(
    new RegExp(`/documentos/document-1/versoes/${generatedVersion.id}$`),
  )
  await expect(page.getByText('Versão 2', { exact: true })).toBeVisible()
  await expect(
    page.getByText('Vollmacht für den Mandanten.', { exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Aprovar versão' })).toBeVisible()
  expect(document.currentVersionId).toBe('version-1')
  expect(browserErrors).toEqual([])
})

test('opens a version, preserves JSON editor content, and approves it with the real PATCH contract', async ({
  documentProduction,
  page,
}) => {
  documentProduction.consultation.versions['version-1'].pendingMarkers = []
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
})

test('shows a conflict without claiming the review succeeded', async ({
  documentProduction,
  page,
}) => {
  documentProduction.consultation.versions['version-1'].pendingMarkers = []
  documentProduction.consultation.failNext('review', 409)
  await page.goto(`/consultas/${CONSULTATION_ID}/documentos/document-1/versoes/version-1`)

  await page.getByRole('button', { name: 'Aprovar versão' }).click()
  await page.getByRole('button', { name: 'Aprovar versão' }).last().click()

  await expect(page.getByRole('alert')).toContainText('Conflito')
  await expect(
    page.getByText('Revise o conteúdo antes de aprovar ou rejeitar esta versão.'),
  ).toBeVisible()
})

test('shows regeneration immediately before the POST responds and keeps it through a stale completed poll [mocked]', async ({
  documentProduction,
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const browserErrors: string[] = []
  page.on('pageerror', (error) => browserErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text())
  })
  page.on('requestfailed', (request) => {
    if (request.failure()?.errorText !== 'net::ERR_ABORTED')
      browserErrors.push(`${request.url()}: ${request.failure()?.errorText}`)
  })
  await page.route('**/communications/summary', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )
  documentProduction.consultation.documents[0].generationStatus = 'completed'
  let releaseRequest!: () => void
  const requestGate = new Promise<void>((resolve) => {
    releaseRequest = resolve
  })
  const generationRequests: unknown[] = []
  await page.route(
    `**/consultations/${CONSULTATION_ID}/documents/document-1/generations`,
    async (route) => {
      generationRequests.push(route.request().postDataJSON())
      await requestGate
      await route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({
          documentGenerationId: 'new-generation',
          documentId: 'document-1',
        }),
      })
    },
  )
  await page.goto(`/consultas/${CONSULTATION_ID}/documentos/document-1/versoes/version-1`)
  await page.getByRole('button', { name: 'Gerar nova versão' }).click()
  await page
    .getByRole('textbox', { name: 'Instruções para a nova versão' })
    .fill('escreva em alemão')
  await page
    .getByRole('alertdialog', { name: 'Gerar nova versão' })
    .getByRole('button', { name: 'Gerar nova versão' })
    .focus()
  await page.keyboard.press('Enter')

  await expect(
    page.getByRole('alertdialog', { name: 'Gerar nova versão' }),
  ).not.toBeVisible()
  await expect(page.getByRole('region', { name: 'Decisão da versão' })).toHaveAttribute(
    'aria-busy',
    'true',
  )
  await expect(page.getByText('Gerando', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cancelar geração' })).toBeDisabled()
  expect(generationRequests).toEqual([{ instructions: 'escreva em alemão' }])
  const initialListRequests = documentProduction.consultation.listRequests
  releaseRequest()
  await expect
    .poll(() => documentProduction.consultation.listRequests)
    .toBeGreaterThan(initialListRequests)
  await expect(page.getByText('Gerando', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cancelar geração' })).toBeEnabled()
  documentProduction.consultation.documents[0].generationStatus = 'running'
  const staleListRequests = documentProduction.consultation.listRequests
  await expect
    .poll(() => documentProduction.consultation.listRequests)
    .toBeGreaterThan(staleListRequests)
  documentProduction.consultation.documents[0].generationStatus = 'failed'
  await expect(page.getByText('Falha na geração', { exact: true })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Decisão da versão' })).toHaveAttribute(
    'aria-busy',
    'false',
  )
  expect(browserErrors).toEqual([])
})
