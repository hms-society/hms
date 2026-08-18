import { expect } from '@playwright/test'

import {
  CONSULTATION_ID,
  DOCUMENT_PRODUCTION_BACKEND,
  test,
} from '../../fixtures/document-production-fixture'

test('lists consultation documents and navigates to the review route', async ({
  documentProduction,
  page,
}) => {
  const requestPromise = page.waitForRequest(
    (request) =>
      request.method() === 'GET' &&
      request.url() ===
        `${DOCUMENT_PRODUCTION_BACKEND}/consultations/${CONSULTATION_ID}/documents`,
  )

  await page.goto(`/consultas/${CONSULTATION_ID}/documentos`)
  await expect(page).toHaveURL(`/consultas/${CONSULTATION_ID}/documentos`)
  await expect(
    page.getByRole('heading', { name: 'Documentos da consulta' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Contrato de prestação de serviços' }),
  ).toBeVisible()
  await expect(page.getByText('Em revisão', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Revisar' })).toHaveAttribute(
    'href',
    `/consultas/${CONSULTATION_ID}/documentos/document-1/versoes/version-1`,
  )

  const request = await requestPromise
  expect(request.url()).toBe(
    `${DOCUMENT_PRODUCTION_BACKEND}/consultations/${CONSULTATION_ID}/documents`,
  )
  expect(documentProduction.consultation.listRequests).toBe(1)

})

test('opens document selection and exercises narrow keyboard layout', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/consultas/${CONSULTATION_ID}/documentos`)

  const selectDocuments = page.getByRole('button', { name: 'Selecionar documentos' })
  await expect(selectDocuments).toBeVisible()
  await selectDocuments.focus()
  await expect(selectDocuments).toBeFocused()
  await selectDocuments.press('Enter')

  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Selecionar documentos' }),
  ).toBeVisible()
  await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll')
})
