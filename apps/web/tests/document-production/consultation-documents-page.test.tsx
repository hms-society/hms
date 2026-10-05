import { expect } from '@playwright/test'

import {
  CONSULTATION_ID,
  DOCUMENT_PRODUCTION_BACKEND,
  test,
} from '../fixtures/document-production-fixture'
import {
  buildConsultationDocumentVersionPath,
  buildConsultationDocumentsPath,
} from '../../src/constants/routes'

const CONSULTATION_DOCUMENTS_PATH = buildConsultationDocumentsPath(CONSULTATION_ID)
const CONSULTATION_DOCUMENT_VERSION_PATH = buildConsultationDocumentVersionPath({
  consultationId: CONSULTATION_ID,
  documentId: 'document-1',
  documentVersionId: 'version-1',
})

for (const generationStatus of ['pending', 'running', 'failed'] as const) {
  test(`keeps existing versions viewable while generation is ${generationStatus} [mocked]`, async ({
    documentProductionFixture,
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    documentProductionFixture.consultation.documents[0].generationStatus = generationStatus
    await page.route('**/communications/summary', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )
    await page.goto(`/consultas/${CONSULTATION_ID}/documentos`)
    await expect(
      page.getByRole('heading', { name: 'Contrato de prestação de serviços' }),
    ).toBeVisible({ timeout: 20_000 })
    const documentRow = page.getByRole('listitem').filter({
      has: page.getByRole('heading', { name: 'Contrato de prestação de serviços' }),
    })
    await expect(documentRow.getByRole('link', { name: 'Visualizar' })).toHaveAttribute(
      'href',
      `/consultas/${CONSULTATION_ID}/documentos/document-1/versoes/version-1`,
    )
    const emptyRow = page.getByRole('listitem').filter({
      has: page.getByRole('heading', { name: 'Procuração', exact: true }),
    })
    await expect(emptyRow.getByRole('link', { name: 'Visualizar' })).toHaveCount(0)
    if (generationStatus !== 'failed')
      await expect(
        documentRow.getByRole('button', { name: 'Cancelar geração' }),
      ).toBeVisible()
    await documentRow.getByRole('link', { name: 'Visualizar' }).press('Enter')
    await expect(page).toHaveURL(/\/documentos\/document-1\/versoes\/version-1$/)
    await expect(page.getByRole('heading', { name: 'Revisar documento' })).toBeVisible()
  })
}

test('lists consultation documents and navigates to the review route', async ({
  documentProductionFixture,
  page,
}) => {
  const listResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'GET' &&
      response.url() ===
        `${DOCUMENT_PRODUCTION_BACKEND}/consultations/${CONSULTATION_ID}/documents`,
  )

  await page.goto(CONSULTATION_DOCUMENTS_PATH)
  await expect(page).toHaveURL(CONSULTATION_DOCUMENTS_PATH)
  await expect(
    page.getByRole('heading', { name: 'Documentos da consulta' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Contrato de prestação de serviços' }),
  ).toBeVisible()
  await expect(page.getByText('Em revisão', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Revisar' })).toHaveAttribute(
    'href',
    CONSULTATION_DOCUMENT_VERSION_PATH,
  )

  const listResponse = await listResponsePromise
  expect(listResponse.status()).toBe(200)
  expect(listResponse.url()).toBe(
    `${DOCUMENT_PRODUCTION_BACKEND}/consultations/${CONSULTATION_ID}/documents`,
  )
  expect(await listResponse.json()).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ title: 'Contrato de prestação de serviços' }),
    ]),
  )
  expect(documentProductionFixture.consultation.listRequests).toBe(1)
})

test('opens document selection and exercises narrow keyboard layout', async ({
  documentProductionFixture: _,
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(CONSULTATION_DOCUMENTS_PATH)

  const selectDocuments = page.getByRole('button', { name: 'Selecionar documentos' })
  await expect(selectDocuments).toBeVisible()
  await selectDocuments.focus()
  await expect(selectDocuments).toBeFocused()
  await selectDocuments.press('Enter')

  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Selecionar documentos' })).toBeVisible()
  await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll')
})
