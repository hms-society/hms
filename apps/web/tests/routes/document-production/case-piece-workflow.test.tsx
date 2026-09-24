import { expect } from '@playwright/test'

import {
  DOCUMENT_PRODUCTION_BACKEND,
  test,
} from '../../fixtures/document-production-fixture'

const CASE_ID = 'case-1'
const DOCUMENT_ID = 'piece-1'
const DOCUMENT_PATH = `/cases/${CASE_ID}/documents/${DOCUMENT_ID}`

test('connects the case piece editor and technical review as full-page routes', async ({
  page,
}) => {
  await page.route(`${DOCUMENT_PRODUCTION_BACKEND}${DOCUMENT_PATH}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: DOCUMENT_ID,
        title: 'Requerimento administrativo de aposentadoria',
        currentVersionId: 'version-1',
        versions: [
          {
            id: 'version-1',
            versionNumber: 1,
            source: 'manual',
            status: 'in_review',
            createdAt: '2026-09-23T12:00:00.000Z',
            createdByCollaboratorId: 'collaborator-1',
            storagePath: 'cases/case-1/pieces/piece-1/versions/version-1/document.pdf',
            content: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  attrs: { textAlign: null },
                  content: [{ type: 'text', text: 'Conteúdo da peça jurídica' }],
                },
              ],
            },
          },
        ],
      }),
    })
  })
  await page.route(`${DOCUMENT_PRODUCTION_BACKEND}/cases/${CASE_ID}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: CASE_ID,
        publicCode: 'CASO-20260923-0002',
        title: 'Aposentadoria por Tempo de Contribuição',
        status: 'active',
        clientName: 'Vinicius Lopes Machado',
        legalArea: 'Previdenciário',
        legalTopic: 'Aposentadoria',
        openedAt: '2026-09-23T12:00:00.000Z',
        updatedAt: '2026-09-23T12:00:00.000Z',
        checklistGate: 'approved',
        dossierGate: 'approved',
        team: [],
      }),
    })
  })
  await page.route(
    `${DOCUMENT_PRODUCTION_BACKEND}${DOCUMENT_PATH}/file`,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: '%PDF-1.4 mock document',
      })
    },
  )

  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto(`/advogado/meus-casos/${CASE_ID}/pecas/${DOCUMENT_ID}`)

  await expect(page.getByText('Visualizando:')).toBeVisible()
  await expect(page.getByText('v1', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Baixar documento' })).toHaveCount(0)

  await page.goto(`/advogado/meus-casos/${CASE_ID}/pecas/${DOCUMENT_ID}/editor`)

  await expect(page).toHaveURL(
    new RegExp(`/advogado/meus-casos/${CASE_ID}/pecas/${DOCUMENT_ID}/editor$`),
  )
  await expect(
    page.getByRole('heading', { name: 'Requerimento administrativo de aposentadoria' }),
  ).toBeVisible()
  await expect(page.getByText('CASO-20260923-0002')).toBeVisible()
  await expect(page.getByTitle('Visualização do documento da peça')).toBeVisible()
  await expect(page.getByText('Conteúdo da peça jurídica')).toHaveCount(0)
  await expect(page.getByRole('toolbar', { name: 'Formatação do template' })).toHaveCount(
    0,
  )
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(1280)

  await page.getByRole('button', { name: 'Submeter para revisão' }).click()

  await expect(page).toHaveURL(
    new RegExp(`/advogado/meus-casos/${CASE_ID}/pecas/${DOCUMENT_ID}/revisao$`),
  )
  await expect(page.getByText('Modo leitura')).toBeVisible()
  await expect(page.getByTitle('Visualização do documento da peça')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Bloqueio' })).toBeVisible()
  await page.setViewportSize({ width: 900, height: 800 })
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(900)
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Voltar ao caso' })).toBeFocused()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(900)

  await page.getByRole('button', { name: 'Bloqueio' }).click()
  await expect(
    page.getByRole('heading', { name: 'Bloquear por falta documental?' }),
  ).toBeVisible()
  await expect(page.getByText('Esta ação terá os seguintes efeitos')).toBeVisible()
  await expect(page.locator('svg.lucide-octagon-alert').first()).toBeVisible()
  await page.getByRole('button', { name: 'Cancelar' }).click()

  await page
    .getByRole('checkbox', { name: /Confirmo minha responsabilidade técnica/ })
    .click()
  await page.getByRole('button', { name: 'Aprovar peça' }).click()
  await expect(page.getByText('CASO-20260923-0002 · Versão v1')).toBeVisible()
  await expect(page.locator('svg.lucide-badge-check').first()).toBeVisible()
  await page.getByRole('button', { name: 'Cancelar' }).click()

  await page.getByRole('button', { name: 'Solicitar ajustes' }).click()
  await expect(
    page.getByRole('heading', { name: 'Solicitar ajustes na peça' }),
  ).toBeVisible()
  await expect(page.locator('svg.lucide-message-square-text').first()).toBeVisible()
  await page
    .getByRole('textbox', { name: 'Comentários para ajuste' })
    .fill('Revisar a fundamentação antes de reenviar.')
  await page.getByRole('button', { name: 'Enviar solicitação' }).click()

  await expect(page).toHaveURL(
    new RegExp(
      `/advogado/meus-casos/${CASE_ID}/pecas/${DOCUMENT_ID}/editor\\?reviewState=adjustments_requested$`,
    ),
  )
  await expect(page.getByText('Ajustes solicitados · v1')).toBeVisible()
  await expect(page.getByText(/Faça as correções antes de resubmeter/)).toBeVisible()

  await page.getByRole('button', { name: 'Resubmeter para revisão' }).click()
  await expect(page).toHaveURL(
    new RegExp(`/advogado/meus-casos/${CASE_ID}/pecas/${DOCUMENT_ID}/revisao$`),
  )
})
