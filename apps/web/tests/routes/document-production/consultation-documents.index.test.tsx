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

  await page.getByRole('link', { name: 'Revisar' }).click()
  await expect(page).toHaveURL(
    `/consultas/${CONSULTATION_ID}/documentos/document-1/versoes/version-1`,
  )
  await expect(
    page.getByRole('heading', { name: 'Contrato de prestação de serviços' }),
  ).toBeVisible()
})

test('keeps batch generation stateful and exercises narrow keyboard layout', async ({
  documentProduction,
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/consultas/${CONSULTATION_ID}/documentos`)

  const generateAll = page.getByRole('button', { name: 'Gerar documentos' })
  await expect(generateAll).toBeVisible()
  await generateAll.focus()
  await expect(generateAll).toBeFocused()
  await generateAll.press('Enter')

  await expect(page.getByRole('button', { name: 'Gerando documentos...' })).toBeVisible()
  await expect.poll(() => documentProduction.consultation.batchGenerationRequests).toBe(1)
  await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll')
})
