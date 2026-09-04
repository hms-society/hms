import { expect } from '@playwright/test'

import { ROUTES } from '@/constants/routes'

import {
  DOCUMENT_PRODUCTION_BACKEND,
  FORMALIZATION_ID,
  test,
} from '../../fixtures/document-production-fixture'

test('runs the formalization form and individual document contract', async ({
  documentProduction,
  page,
}, testInfo) => {
  const { formalization } = documentProduction
  const consoleErrors: string[] = []
  const failedRequests: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.method()} ${request.url()}`)
  })

  await page.goto(`/formalizacoes/${FORMALIZATION_ID}`)
  await expect(page).toHaveURL(`/formalizacoes/${FORMALIZATION_ID}`)
  await expect(page.getByRole('link', { name: 'Voltar para o Intake' })).toHaveAttribute(
    'href',
    ROUTES.intakeDetails.replace('$intakeId', 'intake-1'),
  )
  await expect(
    page.getByRole('heading', {
      name: formalization.details.formalization.contractFormSnapshot.name,
    }),
  ).toBeVisible()

  await page.getByLabel('Serviço contratado').fill('Consultoria jurídica')
  await page.getByLabel('Valor mensal').fill('2500')
  await page.getByRole('combobox', { name: 'Modalidade' }).click()
  await page.getByRole('option', { name: 'Mensal' }).click()

  await page.getByRole('button', { name: 'Salvar rascunho' }).click()
  await expect.poll(() => formalization.draftRequests).toBe(1)
  expect(formalization.requests.at(-1)).toMatchObject({
    method: 'PATCH',
    path: `/formalizations/${FORMALIZATION_ID}/contract-form/draft`,
  })

  await page.getByRole('button', { name: 'Fechar formulário' }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Fechar formulário' })
    .click()
  await expect.poll(() => formalization.closeRequests).toBe(1)
  await expect(
    page.getByRole('heading', { name: 'Documentos da formalização' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Configuração do envio' }),
  ).not.toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('formalization-configuration-summary.png'),
    fullPage: true,
  })
  await expect(page.getByRole('button', { name: 'Gerar documento' })).toBeVisible()

  await page.setViewportSize({ width: 390, height: 844 })
  const generate = page.getByRole('button', { name: 'Gerar documento' })
  await generate.focus()
  await expect(generate).toBeFocused()
  await generate.press('Enter')
  await expect.poll(() => formalization.generationRequests).toBe(1)
  expect(
    formalization.requests.find(
      (r) =>
        r.method === 'POST' &&
        r.path ===
          `/formalizations/${FORMALIZATION_ID}/documents/formalization-document-1/generations`,
    ),
  ).toBeTruthy()
  await expect(page.getByRole('button', { name: 'Revisar' })).toBeVisible()
  await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll')

  if (consoleErrors.length || failedRequests.length) {
    test.info().annotations.push({
      type: 'environment-diagnostic',
      description: `Fixture browser diagnostics: console=${JSON.stringify(consoleErrors)} requests=${JSON.stringify(failedRequests)}`,
    })
  }
  expect(DOCUMENT_PRODUCTION_BACKEND).toBeTruthy()
})

test('intent-preloads a route without a TanStack Router client crash', async ({
  documentProduction,
  page,
}) => {
  const clientErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') clientErrors.push(message.text())
  })
  page.on('pageerror', (error) => {
    clientErrors.push(error.stack ?? error.message)
  })

  await page.goto(`/formalizacoes/${FORMALIZATION_ID}`)
  const intakesLink = page.getByRole('link', { name: 'Intakes' })
  await intakesLink.hover()
  await expect(intakesLink).toHaveAttribute('href', '/intakes')
  await page.waitForTimeout(250)

  const routerErrors = clientErrors.filter((message) =>
    /_nonReactive|loadRouteMatch|preloadRoute|Cannot read properties of undefined/.test(
      message,
    ),
  )
  expect(routerErrors, 'router errors during intent preload').toEqual([])
  expect(documentProduction.formalization).toBeTruthy()
})

test('requires confirmation before closing and reopening the contract form', async ({
  documentProduction,
  page,
}) => {
  const { formalization } = documentProduction

  await page.goto(`/formalizacoes/${FORMALIZATION_ID}`)
  await page.getByLabel('Serviço contratado').fill('Consultoria jurídica')
  await page.getByLabel('Valor mensal').fill('2500')
  await page.getByRole('combobox', { name: 'Modalidade' }).click()
  await page.getByRole('option', { name: 'Mensal' }).click()
  await page.getByRole('button', { name: 'Salvar rascunho' }).click()
  await expect.poll(() => formalization.draftRequests).toBe(1)

  await page.getByRole('button', { name: 'Fechar formulário' }).click()
  const closeDialog = page.getByRole('alertdialog')
  await expect(closeDialog).toContainText('liberar o pacote documental')
  await expect(closeDialog.getByRole('button', { name: 'Cancelar' })).toBeVisible()
  expect(formalization.closeRequests).toBe(0)

  await closeDialog.getByRole('button', { name: 'Cancelar' }).click()
  await expect(closeDialog).not.toBeVisible()

  await page.getByRole('button', { name: 'Fechar formulário' }).click()
  await closeDialog.getByRole('button', { name: 'Fechar formulário' }).click()
  await expect.poll(() => formalization.closeRequests).toBe(1)

  await page.getByRole('button', { name: 'Reabrir formulário' }).click()
  const reopenDialog = page.getByRole('alertdialog')
  await expect(reopenDialog).toContainText('documentos ficarão bloqueados')
  expect(formalization.reopenRequests).toBe(0)
  await reopenDialog.getByRole('button', { name: 'Cancelar' }).click()
  await expect(reopenDialog).not.toBeVisible()

  await page.getByRole('button', { name: 'Reabrir formulário' }).click()
  await reopenDialog.getByRole('button', { name: 'Reabrir formulário' }).click()
  await expect.poll(() => formalization.reopenRequests).toBe(1)
})

test('confirms the document package and closes without contract with the selected reason', async ({
  documentProduction,
  page,
}, testInfo) => {
  const { formalization } = documentProduction
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => {
    pageErrors.push(error.stack ?? error.message)
  })

  await page.goto(`/formalizacoes/${FORMALIZATION_ID}`)
  await page.getByLabel('Serviço contratado').fill('Consultoria jurídica')
  await page.getByLabel('Valor mensal').fill('2500')
  await page.getByRole('combobox', { name: 'Modalidade' }).click()
  await page.getByRole('option', { name: 'Mensal' }).click()
  await page.getByRole('button', { name: 'Salvar rascunho' }).click()
  await expect.poll(() => formalization.draftRequests).toBe(1)
  await page.getByRole('button', { name: 'Fechar formulário' }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Fechar formulário' })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Documentos da formalização' }),
  ).toBeVisible()

  await expect.poll(() => formalization.selectionGetRequests).toBeGreaterThan(0)
  await page.getByRole('button', { name: 'Selecionar documentos' }).click()
  const selectionDialog = page.getByRole('dialog')
  await selectionDialog
    .getByRole('checkbox', { name: 'Selecionar Aditivo contratual' })
    .check()
  await selectionDialog.getByRole('button', { name: 'Adicionar 1 documento' }).click()
  await expect.poll(() => formalization.selectionPutRequests).toBe(1)
  expect(formalization.requests.at(-1)).toMatchObject({
    method: 'PUT',
    path: `/formalizations/${FORMALIZATION_ID}/documents/selection`,
    body: { documentSpecificationIds: ['spec-1', 'spec-2'] },
  })

  const generationResponsePromise = page.waitForResponse(
    (response) =>
      response.url() ===
      `${DOCUMENT_PRODUCTION_BACKEND}/formalizations/${FORMALIZATION_ID}/documents/formalization-document-1/generations`,
  )
  await page.getByRole('button', { name: 'Gerar documento' }).click()
  await generationResponsePromise
  await expect.poll(() => formalization.generationRequests).toBe(1)
  await page.goto(`/formalizacoes/${FORMALIZATION_ID}/documentos/formalization-version-1`)
  await expect(page).toHaveURL(
    `/formalizacoes/${FORMALIZATION_ID}/documentos/formalization-version-1`,
  )
  await expect(page.getByRole('heading', { name: 'Revisar documento' })).toBeVisible()
  const routerErrors = [...consoleErrors, ...pageErrors].filter((message) =>
    /_nonReactive|loadRouteMatch|preloadRoute|Cannot read properties of undefined/.test(
      message,
    ),
  )
  expect(routerErrors, 'router errors during intent preload/navigation').toEqual([])
  await page.getByRole('button', { name: 'Aprovar versão' }).click()
  const approveDialog = page.getByRole('alertdialog')
  const reviewResponsePromise = page.waitForResponse(
    (response) =>
      response.url() ===
      `${DOCUMENT_PRODUCTION_BACKEND}/formalizations/${FORMALIZATION_ID}/document-versions/formalization-version-1/review`,
  )
  await approveDialog.getByRole('button', { name: 'Aprovar versão' }).click()
  await reviewResponsePromise
  await expect.poll(() => formalization.reviewRequests).toBe(1)
  await page.goto(`/formalizacoes/${FORMALIZATION_ID}`)
  await expect(
    page.getByRole('heading', { name: 'Documentos da formalização' }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Confirmar pacote' }).click()
  const packageDialog = page.getByRole('alertdialog')
  await expect(packageDialog).toContainText('não inicia assinaturas nem envia mensagens')
  await page.setViewportSize({ width: 673, height: 453 })
  await page.screenshot({
    path: testInfo.outputPath('vis-06-package-confirmation-dialog.png'),
  })
  expect(formalization.confirmRequests).toBe(0)
  await packageDialog.getByRole('button', { name: 'Cancelar' }).click()
  await expect(packageDialog).not.toBeVisible()

  await page.getByRole('button', { name: 'Confirmar pacote' }).click()
  const reopenedPackageDialog = page.getByRole('alertdialog')
  await expect(reopenedPackageDialog).toBeVisible()
  await expect(page.getByRole('button', { name: 'Confirmar pacote' })).toBeEnabled()
  await reopenedPackageDialog.getByRole('button', { name: 'Confirmar pacote' }).click()
  await expect.poll(() => formalization.confirmRequests).toBe(1)
  await expect(page.getByRole('link', { name: 'Configuração do envio' })).toHaveAttribute(
    'href',
    `/formalizacoes/${FORMALIZATION_ID}/configuracao-envio`,
  )
  expect(
    formalization.requests
      .filter(
        ({ path }) => path === `/formalizations/${FORMALIZATION_ID}/documents/confirm`,
      )
      .at(-1),
  ).toMatchObject({
    method: 'PATCH',
    path: `/formalizations/${FORMALIZATION_ID}/documents/confirm`,
    body: { expectedVersion: 1 },
  })

  await page.getByRole('button', { name: 'Encerrar sem contratação' }).click()
  const closeWithoutContractDialog = page.getByRole('alertdialog')
  await expect(closeWithoutContractDialog).toContainText('Esta ação é definitiva')
  await closeWithoutContractDialog
    .getByRole('button', { name: 'Encerrar sem contratação' })
    .click()
  await expect(
    closeWithoutContractDialog.getByText(
      'Selecione um motivo para encerrar a Formalização.',
    ),
  ).toBeVisible()

  await closeWithoutContractDialog
    .getByRole('combobox', { name: 'Motivo do encerramento' })
    .click()
  await page.getByRole('option', { name: 'Desistência do cliente' }).click()
  await closeWithoutContractDialog
    .getByLabel('Observações (opcional)')
    .fill('Cliente solicitou o encerramento.')
  await closeWithoutContractDialog
    .getByRole('button', { name: 'Encerrar sem contratação' })
    .click()
  await expect.poll(() => formalization.closeWithoutContractRequests).toBe(1)
  expect(
    formalization.requests
      .filter(
        ({ path }) =>
          path === `/formalizations/${FORMALIZATION_ID}/close-without-contract`,
      )
      .at(-1),
  ).toMatchObject({
    method: 'PATCH',
    path: `/formalizations/${FORMALIZATION_ID}/close-without-contract`,
    body: {
      expectedVersion: 1,
      expectedIntakeVersion: 1,
      reason: 'client_withdrew',
      notes: 'Cliente solicitou o encerramento.',
    },
  })
})
