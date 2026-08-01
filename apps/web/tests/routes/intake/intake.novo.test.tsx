import { expect, test as playwrightTest, type Page } from '@playwright/test'

import { test } from '../../fixtures/auth-fixture'

import { ROUTES } from '../../../src/constants/routes'

const BACKEND_URL = 'http://hms-api.test'
const LEGAL_AREA_ID = '47dfd634-75e9-41e4-a47e-05114f923bd0'
const LEGAL_TOPIC_ID = '6aa955f2-a42f-47ce-ab5f-5f0bb62a8d4d'
const CLIENT_ID = '09ee728b-80f6-4234-899c-ca40c75c841f'

async function openNewIntake(page: Page) {
  await page.goto(ROUTES.newIntake)
  await expect(page.getByRole('heading', { name: 'Registrar demanda' })).toBeVisible()
}

async function selectDemand(page: Page) {
  await page.getByRole('combobox', { name: /Área jurídica/ }).click()
  await page.getByRole('option', { name: 'Trabalhista' }).click()
  await page.getByRole('combobox', { name: /Tema jurídico/ }).click()
  await page.getByRole('option', { name: 'Verbas rescisórias' }).click()
}

async function goToClientStep(page: Page) {
  await selectDemand(page)
  await page.getByRole('button', { name: 'Próximo' }).click()
  await expect(page.getByRole('heading', { name: 'Vincular cliente' })).toBeVisible()
}

async function linkExistingClient(page: Page) {
  await page.getByRole('button', { name: 'Identificar ou cadastrar cliente' }).click()
  await page.getByLabel('CPF ou CNPJ').fill('529.982.247-25')
  await page.getByRole('button', { name: 'Buscar cliente' }).click()
  await expect(page.getByRole('heading', { name: 'Cliente já cadastrado' })).toBeVisible()
  await page.getByRole('button', { name: 'Abrir cadastro' }).click()
  await expect(page.getByText('Vinculado')).toBeVisible()
  await page.getByRole('button', { name: 'Próximo' }).click()
  await expect(page.getByRole('heading', { name: 'Definir próximo passo' })).toBeVisible()
}

async function mockNextResponse(
  page: Page,
  url: string,
  status: number,
  body: Record<string, unknown> = {},
) {
  await page.route(
    url,
    async (route) => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
      })
    },
    { times: 1 },
  )
}

test.beforeEach(async ({ page }) => {
  await page.route(`${BACKEND_URL}/legal-catalog/areas`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: LEGAL_AREA_ID, name: 'Trabalhista' }]),
    })
  })

  await page.route(
    `${BACKEND_URL}/legal-catalog/areas/${LEGAL_AREA_ID}/topics`,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: LEGAL_TOPIC_ID, name: 'Verbas rescisórias' }]),
      })
    },
  )

  await page.route('**/clients/lookup', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        client: {
          id: CLIENT_ID,
          type: 'natural',
          name: 'Ricardo Alves',
          taxId: { type: 'cpf', value: '52998224725' },
          phone: '12987654321',
          email: 'ricardo.alves@example.com',
          createdAt: '2026-07-28T12:00:00.000Z',
          updatedAt: '2026-07-28T12:00:00.000Z',
        },
        consents: [],
      }),
    })
  })

  await page.route(`${BACKEND_URL}/intakes`, async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'registered-intake-id' }),
    })
  })
})

test('registers a scheduled intake through the protected route', async ({
  page,
  auth,
}) => {
  await openNewIntake(page)
  await goToClientStep(page)
  await linkExistingClient(page)

  const registerRequestPromise = page.waitForRequest(
    (request) =>
      request.method() === 'POST' && request.url() === `${BACKEND_URL}/intakes`,
  )
  await page.getByRole('button', { name: 'Criar intake' }).click()
  const registerRequest = await registerRequestPromise

  expect(registerRequest.postDataJSON()).toMatchObject({
    clientId: CLIENT_ID,
    responsibleId: auth.id,
    createdBy: auth.id,
    updatedBy: auth.id,
    origin: 'direct',
    contactChannel: 'whatsapp',
    urgency: 'normal',
    decision: 'schedule_consultation',
  })
  await expect(page.getByRole('heading', { name: 'Registrar demanda' })).toBeVisible()
})

playwrightTest('redirects unauthenticated users to login', async ({ page }) => {
  await page.goto(ROUTES.newIntake)

  await expect(page).toHaveURL(new RegExp(`${ROUTES.login}$`))
})

test('keeps the demand step open when required fields are missing', async ({ page }) => {
  await openNewIntake(page)

  await page.getByRole('button', { name: 'Próximo' }).click()

  await expect(page.getByText('Selecione a área jurídica')).toBeVisible()
  await expect(page.getByText('Selecione o tema jurídico')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Registrar demanda' })).toBeVisible()
})

test('keeps the client step open when no client is linked', async ({ page }) => {
  await openNewIntake(page)
  await selectDemand(page)
  await page.getByRole('button', { name: 'Próximo' }).click()

  await expect(page.getByRole('heading', { name: 'Vincular cliente' })).toBeVisible()
  await page.getByRole('button', { name: 'Próximo' }).click()

  await expect(
    page.getByText('Vincule ou cadastre uma pessoa antes de continuar'),
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Vincular cliente' })).toBeVisible()
})

test('shows an error when client lookup fails', async ({ page }) => {
  await openNewIntake(page)
  await goToClientStep(page)
  await mockNextResponse(page, '**/clients/lookup', 500, {
    message: 'temporary failure',
  })

  await page.getByRole('button', { name: 'Identificar ou cadastrar cliente' }).click()
  await page.getByLabel('CPF ou CNPJ').fill('529.982.247-25')
  await page.getByRole('button', { name: 'Buscar cliente' }).click()

  await expect(page.getByRole('alert')).toContainText(
    'Não foi possível realizar a busca. Verifique os dados e tente novamente.',
  )
})

test('offers registration when client lookup returns not found', async ({ page }) => {
  await openNewIntake(page)
  await goToClientStep(page)
  await mockNextResponse(page, '**/clients/lookup', 404, { message: 'not found' })

  await page.getByRole('button', { name: 'Identificar ou cadastrar cliente' }).click()
  await page.getByLabel('CPF ou CNPJ').fill('529.982.247-25')
  await page.getByRole('button', { name: 'Buscar cliente' }).click()

  await expect(
    page.getByRole('heading', { name: 'Cliente não encontrado' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: /Continuar cadastro/ })).toBeVisible()
})

test('shows an error and keeps the form when intake registration fails', async ({
  page,
}) => {
  await openNewIntake(page)
  await goToClientStep(page)
  await linkExistingClient(page)
  await mockNextResponse(page, `${BACKEND_URL}/intakes`, 500, {
    message: 'temporary failure',
  })

  await page.getByRole('button', { name: 'Criar intake' }).click()

  await expect(page.getByRole('alert')).toContainText(
    'Não foi possível registrar o intake. Tente novamente.',
  )
  await expect(page.getByRole('heading', { name: 'Definir próximo passo' })).toBeVisible()
})
test('closes an intake without contract and sends the closure reason', async ({
  page,
  auth,
}) => {
  await openNewIntake(page)
  await goToClientStep(page)
  await linkExistingClient(page)

  await page.getByRole('button', { name: 'Encerrar atendimento' }).last().click()

  await page.getByRole('combobox', { name: /Motivo/i }).click()
  await page.getByRole('option', { name: 'Fora do escopo' }).click()

  const headerClosureButton = page
    .locator('header')
    .getByRole('button', { name: 'Encerrar atendimento' })
  
  await expect(headerClosureButton).toBeEnabled()
  await headerClosureButton.click()
  const dialogHeading = page.getByRole('heading', {
    name: 'Encerrar sem contratação?',
  })
  await expect(dialogHeading).toBeVisible({ timeout: 10000 })

  const closeRequestPromise = page.waitForRequest(
    (request) =>
      request.method() === 'POST' && request.url() === `${BACKEND_URL}/intakes`,
  )
  await page
    .getByRole('button', { name: 'Encerrar sem contratação' })
    .last()
    .click()

  const closeRequest = await closeRequestPromise
  expect(closeRequest.postDataJSON()).toMatchObject({
    clientId: CLIENT_ID,
    responsibleId: auth.id,
    decision: 'close_without_contract',
    closureReason: 'out_of_scope',
  })
})