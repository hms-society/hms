import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { expect } from '@playwright/test'

import {
  DOCUMENT_PRODUCTION_BACKEND,
  FORMALIZATION_ID,
  test,
} from '../../fixtures/document-production-fixture'

test('keeps direct sending configuration access locked until package confirmation', async ({
  documentProduction,
  page,
}, testInfo) => {
  documentProduction.formalization.details.formalization.contractFormState = 'closed'
  await page.goto(`/formalizacoes/${FORMALIZATION_ID}/configuracao-envio`)
  await expect(page).toHaveURL(`/formalizacoes/${FORMALIZATION_ID}/configuracao-envio`)
  await expect(
    page.getByRole('link', { name: 'Voltar para a formalização' }),
  ).toBeVisible()
  await expect(
    page.getByText('Confirme o pacote de documentos para configurar o envio'),
  ).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('formalization-sending-configuration.png'),
    fullPage: true,
  })
  expect(documentProduction.formalization).toBeTruthy()
  expect(DOCUMENT_PRODUCTION_BACKEND).toBeTruthy()
})

test('preserves the signatory controls in the configured tab', async ({
  page,
}, testInfo) => {
  const previewPdf = await readFile(
    resolve(
      process.cwd(),
      '../server/src/document-engine/database/seed-assets/pdf_teste_2_paginas.pdf',
    ),
  )

  await page.route(
    `${DOCUMENT_PRODUCTION_BACKEND}/formalizations/${FORMALIZATION_ID}`,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          formalization: {
            version: 1,
            status: 'in_progress',
            contractFormState: 'closed',
          },
        }),
      })
    },
  )
  await page.route(
    `${DOCUMENT_PRODUCTION_BACKEND}/formalizations/${FORMALIZATION_ID}/documents/selection`,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          selectedDocumentSpecificationIds: ['spec-1'],
          confirmedAt: '2026-08-27T12:00:00.000Z',
          options: [],
        }),
      })
    },
  )
  await page.route(
    `${DOCUMENT_PRODUCTION_BACKEND}/formalizations/${FORMALIZATION_ID}/signature-configuration`,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          formalizationId: FORMALIZATION_ID,
          version: 1,
          editable: true,
          status: 'configuring',
          previewPreparation: {
            total: 1,
            pending: 0,
            processing: 0,
            ready: 1,
            failed: 0,
          },
          signatories: [
            {
              signatoryId: 'client-signatory',
              personId: 'client-1',
              role: 'client',
              name: 'Cliente HMS Teste',
              removable: false,
              availableChannels: ['email', 'whatsapp'],
              selectedChannels: ['email'],
              documentIds: ['document-1'],
            },
            {
              signatoryId: 'lawyer-signatory',
              personId: 'lawyer-1',
              role: 'responsible_lawyer',
              name: 'Advogado responsável',
              removable: false,
              availableChannels: ['email'],
              selectedChannels: ['email'],
              documentIds: ['document-1'],
            },
          ],
          documents: [
            {
              documentId: 'document-1',
              documentVersionId: 'version-1',
              name: 'Contrato de formalização',
              reviewStatus: 'approved',
              preview: {
                previewId: 'preview-1',
                state: 'ready',
                pageCount: 2,
                pages: [
                  { page: 1, width: 595, height: 842 },
                  { page: 2, width: 595, height: 842 },
                ],
              },
              fields: [
                {
                  fieldId: 'field-1',
                  signatoryId: 'client-signatory',
                  previewId: 'preview-1',
                  type: 'signature',
                  page: 1,
                  positionX: 10,
                  positionY: 10,
                  width: 24,
                  height: 8,
                },
              ],
            },
          ],
          readiness: { ready: false, assignmentCount: 2, issues: [] },
        }),
      })
    },
  )
  await page.route(
    `${DOCUMENT_PRODUCTION_BACKEND}/formalizations/${FORMALIZATION_ID}/signature-configuration/previews/preview-1/content`,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: previewPdf,
      })
    },
  )

  await page.goto(`/formalizacoes/${FORMALIZATION_ID}/configuracao-envio`)
  await expect(page.getByRole('tab', { name: 'Resumo' })).toBeDisabled()
  await page.getByRole('tab', { name: 'Campos' }).click()
  await expect(page.getByRole('heading', { name: 'Prévia do documento' })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Documento' })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Signatário' })).toBeVisible()
  await expect(page.getByText('Pendente').first()).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Campos' })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Adicionar campo' })).toBeEnabled()
  const signatureField = page.getByRole('button', {
    name: 'Campo de assinatura para Cliente HMS Teste',
  })
  await expect(signatureField).toBeVisible()
  await expect(signatureField).toBeEnabled()
  await page.getByRole('button', { name: 'Adicionar campo' }).click()
  await expect(
    page.getByRole('button', {
      name: 'Campo de assinatura para Cliente HMS Teste',
    }),
  ).toHaveCount(2)
  await page.getByRole('tab', { name: 'Signatários' }).click()
  await expect(page.getByRole('alertdialog')).toBeVisible()
  await expect(page.getByRole('alertdialog')).toContainText(
    'Existem alterações de campos não salvas',
  )
  await page.getByRole('button', { name: 'Continuar editando' }).click()
  await expect(page.getByRole('heading', { name: 'Prévia do documento' })).toBeVisible()
  const removeAllFieldsButton = page.getByRole('button', {
    name: 'Remover todos os campos',
  })
  await expect(removeAllFieldsButton).toBeEnabled()
  await removeAllFieldsButton.click()
  await expect(page.getByRole('alertdialog')).toBeVisible()
  await page.getByRole('button', { name: 'Remover todos' }).click()
  await expect(
    page.getByRole('button', {
      name: 'Campo de assinatura para Cliente HMS Teste',
    }),
  ).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Adicionar campo' })).toBeEnabled()
  await expect(page.getByText('100%')).toBeVisible()
  await page.getByRole('button', { name: 'Aumentar zoom' }).click()
  await expect(page.getByText('125%')).toBeVisible()
  await page.getByRole('button', { name: 'Reduzir zoom' }).click()
  await expect(page.getByText('100%')).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('signature-fields-tab-redesign.png'),
    fullPage: true,
  })

  await page.getByRole('tab', { name: 'Signatários' }).click()
  await expect(page.getByRole('alertdialog')).toBeVisible()
  await page.getByRole('button', { name: 'Sair sem salvar' }).click()
  await expect(page.getByRole('heading', { name: 'Signatários' })).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Prévia do documento' }),
  ).not.toBeVisible()
  const addSignatoryButton = page.getByRole('button', { name: 'Adicionar signatário' })
  await expect(addSignatoryButton).toBeVisible()
  await expect(addSignatoryButton).toBeEnabled()
  await expect(page.getByRole('checkbox', { name: 'E-mail' }).first()).toBeVisible()
  await expect(page.getByRole('checkbox', { name: 'WhatsApp' })).toBeVisible()
  await expect(page.getByText('1 de 1 selecionados').first()).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Salvar atribuições' }).first(),
  ).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('signatories-tab-redesign.png'),
    fullPage: true,
  })

  await page.route(
    `${DOCUMENT_PRODUCTION_BACKEND}/formalizations/${FORMALIZATION_ID}/signature-configuration/candidates**`,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              collaboratorId: 'collaborator-1',
              name: 'Marina Costa',
              email: 'marina@example.com',
              profile: 'lawyer',
            },
          ],
          page: 1,
          limit: 20,
          total: 1,
        }),
      })
    },
  )
  await page.getByRole('button', { name: 'Adicionar signatário' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByLabel('Buscar colaborador')).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('signatories-candidate-dialog-redesign.png'),
    fullPage: true,
  })
})
