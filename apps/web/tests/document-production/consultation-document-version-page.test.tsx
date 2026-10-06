import { expect } from '@playwright/test'

import {
  CONSULTATION_ID,
  DOCUMENT_PRODUCTION_BACKEND,
  test,
} from '../fixtures/document-production-fixture'
import { buildConsultationDocumentVersionPath } from '../../src/constants/routes'

const DOCUMENT_VERSION_PATH = buildConsultationDocumentVersionPath({
  consultationId: CONSULTATION_ID,
  documentId: 'document-1',
  documentVersionId: 'version-1',
})

test('reviews a version with the mocked PATCH contract and displays approval guidance', async ({
  documentProductionFixture,
  page,
}) => {
  documentProductionFixture.consultation.versions['version-1'].pendingMarkers = []
  await page.goto(DOCUMENT_VERSION_PATH)
  await expect(
    page.getByText('Contrato de prestação de serviços', { exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Conteúdo da versão 1' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Aprovar versão' })).toBeVisible()

  await page.getByRole('button', { name: 'Aprovar versão' }).click()
  await expect(page.getByRole('heading', { name: 'Aprovar versão?' })).toBeVisible()

  const reviewResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'PATCH' &&
      response.url() ===
        `${DOCUMENT_PRODUCTION_BACKEND}/consultations/${CONSULTATION_ID}/documents/document-1/versions/version-1/review`,
  )
  await page.getByRole('button', { name: 'Aprovar versão' }).last().click()

  const reviewResponse = await reviewResponsePromise
  expect(reviewResponse.status()).toBe(200)
  expect(await reviewResponse.json()).toMatchObject({ status: 'approved' })
  expect(reviewResponse.request().postDataJSON()).toEqual({ decision: 'approved' })
  await expect.poll(() => documentProductionFixture.consultation.reviewRequests).toBe(1)
  expect(documentProductionFixture.consultation.requests).toContainEqual({
    method: 'PATCH',
    path: `/consultations/${CONSULTATION_ID}/documents/document-1/versions/version-1/review`,
    body: { decision: 'approved' },
  })
  await expect(
    page.getByText(
      'A aprovação é definitiva. Selecione esta versão para torná-la vigente.',
    ),
  ).toBeVisible()
})

test('shows a conflict without claiming the review succeeded', async ({
  documentProductionFixture,
  page,
}) => {
  documentProductionFixture.consultation.versions['version-1'].pendingMarkers = []
  documentProductionFixture.consultation.failNext('review', 409)
  await page.goto(DOCUMENT_VERSION_PATH)

  await page.getByRole('button', { name: 'Aprovar versão' }).click()

  const reviewResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'PATCH' &&
      response.url() ===
        `${DOCUMENT_PRODUCTION_BACKEND}/consultations/${CONSULTATION_ID}/documents/document-1/versions/version-1/review`,
  )
  await page.getByRole('button', { name: 'Aprovar versão' }).last().click()

  const reviewResponse = await reviewResponsePromise
  expect(reviewResponse.status()).toBe(409)
  expect(await reviewResponse.json()).toMatchObject({
    message: 'Mocked consultation response: 409',
  })
  await expect(page.getByRole('alert')).toContainText('Conflito')
  await expect(
    page.getByText('Revise o conteúdo antes de aprovar ou rejeitar esta versão.'),
  ).toBeVisible()
})

test('blocks approval while pending markers remain and opens their details [mocked]', async ({
  documentProductionFixture,
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.route('**/communications/summary', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )
  await page.goto(DOCUMENT_VERSION_PATH)

  await expect(page.getByRole('button', { name: 'Aprovar versão' })).toBeDisabled()
  await expect(
    page.getByText('Resolva as pendências do documento antes de aprovar esta versão.'),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Pendências (1)' }).press('Enter')
  await expect(page.getByRole('dialog', { name: 'Pendências do documento' })).toBeVisible()
  await expect(page.getByText('{client_name}', { exact: true })).toBeVisible()
  expect(documentProductionFixture.consultation.reviewRequests).toBe(0)
})

test('links a reviewed document to its corresponding template [mocked]', async ({
  documentProductionFixture,
  page,
}) => {
  expect(
    documentProductionFixture.consultation.documents[0].documentSpecificationId,
  ).toBe('spec-1')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.route('**/communications/summary', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )
  await page.goto(DOCUMENT_VERSION_PATH)
  await expect(page.getByRole('link', { name: 'Ver modelo' })).toHaveAttribute(
    'href',
    '/modelos-de-documentos/spec-1',
  )
  await page.getByRole('link', { name: 'Ver modelo' }).press('Enter')
  await expect(page).toHaveURL(/\/modelos-de-documentos\/spec-1$/)
  await expect(page.getByRole('heading', { name: 'Procuração' })).toBeVisible()
})

test('opens the generated version after regeneration completes [mocked]', async ({
  documentProductionFixture,
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.route('**/communications/summary', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )
  const document = documentProductionFixture.consultation.documents[0]
  document.generationStatus = 'completed'
  document.currentVersionId = 'version-1'
  document.versions[0].status = 'approved'
  documentProductionFixture.consultation.versions['version-1'].status = 'approved'
  await page.goto(DOCUMENT_VERSION_PATH)
  await page.getByRole('button', { name: 'Gerar nova versão' }).click()
  await page.getByRole('textbox', { name: 'Instruções para a nova versão' }).fill(
    'escreva em alemão',
  )
  await page
    .getByRole('alertdialog', { name: 'Gerar nova versão' })
    .getByRole('button', { name: 'Gerar nova versão' })
    .press('Enter')

  await expect(page.getByText('Gerando', { exact: true })).toBeVisible()
  const generatedVersion = {
    ...documentProductionFixture.consultation.versions['version-1'],
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
    } as unknown as (typeof documentProductionFixture.consultation.versions)[string]['content'],
  }
  documentProductionFixture.consultation.versions[generatedVersion.id] = generatedVersion
  document.versions.push({
    ...document.versions[0],
    id: generatedVersion.id,
    versionNumber: 2,
    status: 'in_review',
  })
  await expect(page).toHaveURL(/\/documentos\/document-1\/versoes\/generated-version-2$/)
  await expect(page.getByText('Versão 2', { exact: true })).toBeVisible()
  await expect(page.getByText('Vollmacht für den Mandanten.', { exact: true })).toBeVisible()
  expect(document.currentVersionId).toBe('version-1')
})

test('keeps generation state visible while the request is pending [mocked]', async ({
  documentProductionFixture,
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.route('**/communications/summary', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )
  documentProductionFixture.consultation.documents[0].generationStatus = 'completed'
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
  await page.goto(DOCUMENT_VERSION_PATH)
  await page.getByRole('button', { name: 'Gerar nova versão' }).click()
  await page.getByRole('textbox', { name: 'Instruções para a nova versão' }).fill(
    'escreva em alemão',
  )
  await page
    .getByRole('alertdialog', { name: 'Gerar nova versão' })
    .getByRole('button', { name: 'Gerar nova versão' })
    .press('Enter')

  await expect(page.getByRole('alertdialog', { name: 'Gerar nova versão' })).not.toBeVisible()
  await expect(page.getByRole('region', { name: 'Decisão da versão' })).toHaveAttribute(
    'aria-busy',
    'true',
  )
  await expect(page.getByText('Gerando', { exact: true })).toBeVisible()
  expect(generationRequests).toEqual([{ instructions: 'escreva em alemão' }])
  releaseRequest()
})
