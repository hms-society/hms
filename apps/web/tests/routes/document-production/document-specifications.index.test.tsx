import { expect } from '@playwright/test'
import {
  DOCUMENT_PRODUCTION_BACKEND,
  test,
} from '../../fixtures/document-production-fixture'
import { ROUTES } from '../../../src/constants/routes'

test('renders the protected document specifications route and preserves the API query contract', async ({
  documentProduction,
  page,
}) => {
  const requestPromise = page.waitForRequest(
    (request) =>
      request.method() === 'GET' &&
      request.url().startsWith(`${DOCUMENT_PRODUCTION_BACKEND}/document-specifications`),
  )
  const expectedUrl = `${ROUTES.documentSpecifications}?search=Procura%C3%A7%C3%A3o&page=1&pageSize=20`
  await page.goto(expectedUrl)
  await expect(page).toHaveURL(expectedUrl)
  await expect(page.getByRole('heading', { name: 'Modelos de documentos' })).toBeVisible()
  await expect(page.getByText('Procuração', { exact: true })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Modelo' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Aplicação' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Estado' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Atualizado' })).toHaveCount(0)
  await expect(
    page.getByRole('columnheader', { name: 'Ação', exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'Novo modelo' })).toHaveAttribute(
    'href',
    ROUTES.newDocumentSpecification,
  )
  await expect(page.getByRole('link', { name: 'Editar Procuração' })).toHaveAttribute(
    'href',
    '/modelos-de-documentos/spec-1',
  )
  const request = await requestPromise
  expect(new URL(request.url()).searchParams.get('search')).toBe('Procuração')
  expect(documentProduction.listRequests).toBe(1)
})

test('keeps long model names inside the model column on narrow viewports', async ({
  documentProduction,
  page,
}) => {
  const longModelName = 'Teste de revisão — Procuração inconsistente com complemento'

  await page.route(
    `${DOCUMENT_PRODUCTION_BACKEND}/document-specifications*`,
    async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue()
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [{ ...documentProduction.details, name: longModelName }],
          page: 1,
          pageSize: 20,
          total: 1,
          totalPages: 1,
        }),
      })
    },
  )
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(ROUTES.documentSpecifications)

  const firstDataRow = page.getByRole('row').nth(1)
  const modelCell = firstDataRow.getByRole('cell').nth(0)
  const applicationCell = firstDataRow.getByRole('cell').nth(1)
  await expect(modelCell).toBeVisible()
  const modelBox = await modelCell.boundingBox()
  const applicationBox = await applicationCell.boundingBox()

  await expect(modelCell.locator('[title]').first()).toHaveAttribute(
    'title',
    longModelName,
  )
  expect(modelBox).not.toBeNull()
  expect(applicationBox).not.toBeNull()
  if (!modelBox || !applicationBox)
    throw new Error('Table cells should have layout boxes')
  expect(modelBox.x + modelBox.width).toBeLessThanOrEqual(applicationBox.x)
})

test('navigates to create without POST and follows the 201 replace redirect', async ({
  documentProduction,
  page,
}) => {
  const postRequests: string[] = []
  page.on('request', (request) => {
    if (request.method() === 'POST') postRequests.push(request.url())
  })

  await page.goto(ROUTES.documentSpecifications)
  await page.getByRole('link', { name: 'Novo modelo' }).click()
  await expect(page).toHaveURL(ROUTES.newDocumentSpecification)
  await page.getByLabel('Nome do documento *').fill('Contrato de honorários')
  await page.getByLabel('Descrição interna (opcional)').fill('Modelo de contrato')
  await page.getByRole('tab', { name: 'Template' }).click()
  await page.locator('.ProseMirror').fill('Conteúdo do contrato')
  await page.getByRole('button', { name: 'Salvar modelo' }).click()
  await expect(page).toHaveURL('/modelos-de-documentos/created-specification')
  expect(documentProduction.createRequests).toBe(1)
  expect(documentProduction.templatePatchRequests).toBe(0)
  expect(postRequests).toHaveLength(1)
})

test('allows saving an available model before the template is filled', async ({
  documentProduction,
  page,
}) => {
  await page.goto(ROUTES.documentSpecifications)
  await page.getByRole('link', { name: 'Novo modelo' }).click()
  await page.getByLabel('Nome do documento *').fill('Modelo disponível')

  const saveButton = page.getByRole('button', { name: 'Salvar modelo' })
  await expect(saveButton).toBeEnabled()
  await saveButton.click()

  await expect(page).toHaveURL('/modelos-de-documentos/created-specification')
  expect(documentProduction.createRequests).toBe(1)
})

test('navigates to edit, preserves filters, and patches once after a dirty change', async ({
  documentProduction,
  page,
}) => {
  await page.goto(
    `${ROUTES.documentSpecifications}?legalAreaId=area-1&legalTopicId=topic-1&status=available`,
  )
  await page.getByRole('link', { name: 'Editar Procuração' }).click()
  await expect(page).toHaveURL('/modelos-de-documentos/spec-1')
  await expect(page.getByLabel('Nome do documento *')).toHaveValue('Procuração')
  expect(documentProduction.getRequests).toBe(1)
  await page.getByLabel('Nome do documento *').fill('Procuração atualizada')
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('tab', { name: 'Template' }).click()
  const editor = page.locator('.ProseMirror')
  await expect(editor).toBeVisible()
  await editor.fill('Conteúdo atualizado')
  await page.getByRole('button', { name: 'Salvar modelo' }).click()
  await page.getByRole('tab', { name: 'Configuração' }).click()
  await expect(page.getByLabel('Nome do documento *')).toHaveValue(
    'Procuração atualizada',
  )
  expect(documentProduction.patchRequests).toBe(1)
  expect(documentProduction.templatePatchRequests).toBe(0)
})

test('keeps the current tab after cancelling the unsaved changes confirmation', async ({
  documentProduction: _,
  page,
}) => {
  await page.goto(ROUTES.documentSpecifications)
  await page.getByRole('link', { name: 'Editar Procuração' }).click()
  await page.getByLabel('Nome do documento *').fill('Procuração alterada')

  const dialogMessages: string[] = []
  page.on('dialog', async (dialog) => {
    dialogMessages.push(dialog.message())
    await dialog.dismiss()
  })

  await page.getByRole('tab', { name: 'Template' }).click()

  await expect(page.getByRole('tab', { name: 'Configuração' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  expect(dialogMessages).toEqual([
    'Existem alterações não salvas. Deseja trocar de aba mesmo assim?',
  ])
})

test('applies a bulleted list through the template toolbar', async ({
  documentProduction: _,
  page,
}) => {
  await page.goto(ROUTES.documentSpecifications)
  await page.getByRole('link', { name: 'Editar Procuração' }).click()
  await page.getByRole('tab', { name: 'Template' }).click()

  await page.getByRole('button', { name: 'Lista', exact: true }).click()

  const editor = page.locator('.ProseMirror')
  await expect(editor.locator('ul')).toBeVisible()
  await expect(editor.locator('ul')).toHaveCSS('list-style-type', 'disc')
  await expect(page.getByRole('button', { name: 'Lista', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('applies an ordered list through the template toolbar and persists it', async ({
  documentProduction,
  page,
}) => {
  await page.goto(ROUTES.documentSpecifications)
  await page.getByRole('link', { name: 'Editar Procuração' }).click()
  await page.getByRole('tab', { name: 'Template' }).click()

  await page.getByRole('button', { name: 'Lista numerada' }).click()

  const editor = page.locator('.ProseMirror')
  await editor.fill('Primeiro item numerado')
  await expect(editor.locator('ol')).toBeVisible()
  await expect(editor.locator('ol')).toHaveCSS('list-style-type', 'decimal')
  await expect(page.getByRole('button', { name: 'Lista numerada' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await page.getByRole('button', { name: 'Salvar modelo' }).click()
  await expect(page.getByRole('button', { name: 'Salvar modelo' })).toBeDisabled()
  expect(documentProduction.patchRequests).toBe(1)
  expect(documentProduction.templatePatchRequests).toBe(0)
  expect(documentProduction.details.content).toEqual(
    expect.objectContaining({
      content: expect.arrayContaining([expect.objectContaining({ type: 'orderedList' })]),
    }),
  )
})

test('applies a blockquote through the template toolbar', async ({
  documentProduction: _,
  page,
}) => {
  await page.goto(ROUTES.documentSpecifications)
  await page.getByRole('link', { name: 'Editar Procuração' }).click()
  await page.getByRole('tab', { name: 'Template' }).click()

  await page.getByRole('button', { name: 'Citação' }).click()

  const quote = page.locator('.ProseMirror blockquote')
  await expect(quote).toBeVisible()
  await expect(quote).toHaveCSS('background-color', /oklab|rgb/)
  await expect(page.getByRole('button', { name: 'Citação' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})
