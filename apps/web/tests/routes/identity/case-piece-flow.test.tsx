import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'

import { test } from '../../fixtures/document-production-fixture'

const BACKEND_URL = 'http://hms-api.test'
const CASE_ID = 'case-piece-flow-1'
const DOCUMENT_ID = 'document-piece-1'
const VERSION_ID = 'version-piece-1'

const pendingVariable = {
  marker: '{client_name}',
  technicalName: 'client_name',
  label: 'Nome do cliente',
}

function documentResponse() {
  return {
    id: DOCUMENT_ID,
    title: 'Requerimento administrativo de aposentadoria',
    currentVersionId: VERSION_ID,
    versions: [
      {
        id: VERSION_ID,
        versionNumber: 1,
        source: 'ai',
        status: 'in_review',
        createdAt: '2026-10-05T12:00:00.000Z',
        createdByCollaboratorId: 'admin',
        storagePath: 'pieces/document-piece-1.pdf',
        pendingVariables: [pendingVariable],
        pendingMarkers: [pendingVariable],
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              attrs: { textAlign: null },
              content: [{ type: 'text', text: 'Requerimento de {client_name}.' }],
            },
          ],
        },
      },
    ],
  }
}

async function mockCasePieceApi(page: Page) {
  await page.route(`${BACKEND_URL}/**`, async (route) => {
    const request = route.request()
    const url = new URL(request.url())

    if (url.pathname === `/cases/${CASE_ID}` && request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: CASE_ID,
          intakeId: 'intake-1',
          publicCode: 'CASO-PECA-0001',
          title: 'Aposentadoria por tempo de contribuição',
          status: 'ready_for_legal_production',
          clientName: 'Adriana Aparecida da Silva',
          legalArea: 'Previdenciário',
          legalTopic: 'Aposentadoria',
          openedAt: '2026-10-01T12:00:00.000Z',
          updatedAt: '2026-10-05T12:00:00.000Z',
          checklistGate: { decision: 'approved' },
          dossierGate: { homologatedAt: '2026-10-05T12:00:00.000Z' },
          team: [],
        }),
      })
      return
    }

    if (url.pathname === '/cases/my' && request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: CASE_ID,
            title: 'Aposentadoria por tempo de contribuição',
            clientName: 'Adriana Aparecida da Silva',
            legalArea: 'Previdenciário',
            publicCode: 'CASO-PECA-0001',
          },
        ]),
      })
      return
    }

    if (
      url.pathname === `/cases/${CASE_ID}/checklist` &&
      request.method() === 'GET'
    ) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
      return
    }

    if (url.pathname === '/documents' && request.method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
      return
    }

    if (url.pathname === `/cases/${CASE_ID}/portal-access` && request.method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
      return
    }

    if (url.pathname === '/third-parties' && request.method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
      return
    }

    if (url.pathname === '/collaborators/me' && request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          collaboratorId: 'admin',
          professionalName: 'Admin',
          email: 'admin@hms.test',
          profile: 'admin',
          status: 'active',
        }),
      })
      return
    }

    if (url.pathname === `/cases/${CASE_ID}/documents` && request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([documentResponse()]),
      })
      return
    }

    if (
      url.pathname === `/cases/${CASE_ID}/documents/${DOCUMENT_ID}` &&
      request.method() === 'GET'
    ) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(documentResponse()),
      })
      return
    }

    if (
      url.pathname === `/cases/${CASE_ID}/documents/${DOCUMENT_ID}/file` &&
      request.method() === 'GET'
    ) {
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: Buffer.from('%PDF-1.4 mocked legal piece'),
      })
      return
    }

    await route.continue()
  })
}

test('navigates from a case to a generated piece editor and reviewer [mocked transport]', async ({
  page,
}) => {
  await mockCasePieceApi(page)
  await page.goto(`/advogado/meus-casos/${CASE_ID}`)

  await expect(page.getByRole('tab', { name: 'Peças' })).toBeEnabled()
  await page.getByRole('tab', { name: 'Peças' }).click()
  await expect(page.getByText('Requerimento administrativo de aposentadoria')).toBeVisible()

  await page.getByRole('button', { name: 'Abrir no editor' }).click()
  await expect(page).toHaveURL(
    new RegExp(`/advogado/meus-casos/${CASE_ID}/pecas/${DOCUMENT_ID}/editor$`),
  )
  await expect(page.getByRole('heading', { name: 'Requerimento administrativo de aposentadoria' })).toBeVisible()
  await expect(page.getByText('Variáveis pendentes', { exact: true })).toBeVisible()
  await expect(page.getByText('Não informado nos documentos', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Inserir valores', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Inserir valores', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Inserir valores pendentes' })).toBeVisible()
  await page.getByLabel('Nome do cliente').fill('Adriana Aparecida da Silva')
  await page.getByRole('button', { name: 'Inserir valores' }).click()
  await expect(page.getByText('Requerimento de Adriana Aparecida da Silva.')).toBeVisible()

  await page.getByRole('button', { name: 'Voltar ao caso' }).click()
  await expect(page).toHaveURL(new RegExp(`/advogado/meus-casos/${CASE_ID}$`))

  await page.getByRole('tab', { name: 'Peças' }).click()
  await page.getByRole('button', { name: 'Abrir revisão técnica' }).click()
  await expect(page).toHaveURL(
    new RegExp(`/advogado/meus-casos/${CASE_ID}/pecas/${DOCUMENT_ID}/revisao$`),
  )
  await expect(page.getByText('Modo leitura')).toBeVisible()
})

test('requests the generated file when downloading a piece version [mocked transport]', async ({
  page,
}) => {
  await mockCasePieceApi(page)
  const fileRequest = page.waitForRequest(
    `${BACKEND_URL}/cases/${CASE_ID}/documents/${DOCUMENT_ID}/file`,
  )
  await page.goto(`/advogado/meus-casos/${CASE_ID}`)
  await page.getByRole('tab', { name: 'Peças' }).click()
  await page.getByRole('button', { name: 'Baixar v1' }).click()
  await expect(fileRequest).resolves.toBeTruthy()
})
