import { expect } from '@playwright/test'
import { test } from '../fixtures/auth-fixture'
import { buildClientDetailsPath } from '../../src/constants/routes'

const BACKEND_URL = 'http://hms-api.test'
const CLIENT_ID = '1aca4870-15a9-41f2-a23d-b4f7e2a9c8b0'
const CLIENT_DETAILS_PATH = buildClientDetailsPath(CLIENT_ID)
const CLIENT = {
  id: CLIENT_ID,
  type: 'natural',
  name: 'Kristie Friesen',
  taxId: { type: 'cpf', value: '09208262456' },
  phone: '2298775242',
  email: 'Kasey_Considine@hotmail.com',
}

test.beforeEach(async ({ page }) => {
  await page.route(`${BACKEND_URL}/clients/${CLIENT_ID}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        client: {
          ...CLIENT,
        },
        consents: [],
      }),
    })
  })

  await page.route(`${BACKEND_URL}/intakes/clients/${CLIENT_ID}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    })
  })

  await page.route(
    `${BACKEND_URL}/communications/clients/${CLIENT_ID}`,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'msg-1',
            channel: 'email',
            direction: 'inbound',
            content: 'Olá, gostaria de saber sobre o meu caso.',
            author: 'Cliente',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'msg-2',
            channel: 'email',
            direction: 'outbound',
            content: 'Prezada Kristie, enviamos a documentação anexa.',
            author: 'atendente@hmsadvogados.com.br',
            createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
          },
        ]),
      })
    },
  )
})

test('renders client details and communications in the correct tab', async ({ page }) => {
  const clientResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'GET' &&
      response.url() === `${BACKEND_URL}/clients/${CLIENT_ID}`,
  )
  const intakesResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'GET' &&
      response.url() === `${BACKEND_URL}/intakes/clients/${CLIENT_ID}`,
  )
  const communicationsResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'GET' &&
      response.url() === `${BACKEND_URL}/communications/clients/${CLIENT_ID}`,
  )

  await page.goto(CLIENT_DETAILS_PATH)

  await expect(page).toHaveURL(CLIENT_DETAILS_PATH)
  await expect(page.getByRole('heading', { name: 'Kristie Friesen' })).toBeVisible()
  await expect(page.getByText('092.082.624-56')).toBeVisible()

  await page.getByText('Comunicações').click()

  await expect(page.getByText('Olá, gostaria de saber sobre o meu caso.')).toBeVisible()
  await expect(
    page.getByText('Prezada Kristie, enviamos a documentação anexa.'),
  ).toBeVisible()

  const clientResponse = await clientResponsePromise
  expect(clientResponse.status()).toBe(200)
  expect(await clientResponse.json()).toMatchObject({
    client: { id: CLIENT.id, name: CLIENT.name },
  })

  const intakesResponse = await intakesResponsePromise
  expect(intakesResponse.status()).toBe(200)
  expect(await intakesResponse.json()).toEqual([])

  const communicationsResponse = await communicationsResponsePromise
  expect(communicationsResponse.status()).toBe(200)
  expect(await communicationsResponse.json()).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: 'msg-1', direction: 'inbound' }),
    ]),
  )
})

test('filters communications by selected channel', async ({ page }) => {
  await page.goto(CLIENT_DETAILS_PATH)
  await page.getByText('Comunicações').click()

  await expect(page.getByText('Olá, gostaria de saber sobre o meu caso.')).toBeVisible()

  await page.getByRole('combobox').filter({ hasText: 'Todos os canais' }).click()
  await page.getByRole('option', { name: 'E-mail' }).click()

  await expect(page.getByText('Olá, gostaria de saber sobre o meu caso.')).toBeVisible()
  await expect(
    page.getByText('Prezada Kristie, enviamos a documentação anexa.'),
  ).toBeVisible()
})

test('filters communications by selected type', async ({ page }) => {
  await page.goto(CLIENT_DETAILS_PATH)
  await page.getByText('Comunicações').click()

  await expect(page.getByText('Olá, gostaria de saber sobre o meu caso.')).toBeVisible()

  await page.getByRole('combobox').filter({ hasText: 'Todos os tipos' }).click()
  await page.getByRole('option', { name: 'Recebidas' }).click()

  await expect(page.getByText('Olá, gostaria de saber sobre o meu caso.')).toBeVisible()
  await expect(
    page.getByText('Prezada Kristie, enviamos a documentação anexa.'),
  ).not.toBeVisible()
})

test('filters communications by selected period', async ({ page }) => {
  await page.goto(CLIENT_DETAILS_PATH)
  await page.getByText('Comunicações').click()

  await expect(
    page.getByText('Prezada Kristie, enviamos a documentação anexa.'),
  ).toBeVisible()

  await page.getByRole('combobox').filter({ hasText: 'Todo o período' }).click()
  await page.getByRole('option', { name: 'Últimos 7 dias' }).click()

  await expect(page.getByText('Olá, gostaria de saber sobre o meu caso.')).toBeVisible()
  await expect(
    page.getByText('Prezada Kristie, enviamos a documentação anexa.'),
  ).not.toBeVisible()
})

test('displays empty state message when no communications match filters', async ({
  page,
}) => {
  await page.goto(CLIENT_DETAILS_PATH)
  await page.getByText('Comunicações').click()

  await page.getByRole('combobox').filter({ hasText: 'Todos os tipos' }).click()
  await page.getByRole('option', { name: 'Enviadas' }).click()

  await page.getByRole('combobox').filter({ hasText: 'Todo o período' }).click()
  await page.getByRole('option', { name: 'Últimos 7 dias' }).click()

  await expect(
    page.getByText('Olá, gostaria de saber sobre o meu caso.'),
  ).not.toBeVisible()
  await expect(
    page.getByText('Prezada Kristie, enviamos a documentação anexa.'),
  ).not.toBeVisible()
  await expect(
    page.getByText('Nenhuma comunicação encontrada com os filtros selecionados.'),
  ).toBeVisible()
})

test('displays error message when communication API fails', async ({ page }) => {
  const communicationsResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'GET' &&
      response.url() === `${BACKEND_URL}/communications/clients/${CLIENT_ID}`,
  )
  await page.route(
    `${BACKEND_URL}/communications/clients/${CLIENT_ID}`,
    async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' }),
      })
    },
  )

  await page.goto(CLIENT_DETAILS_PATH)
  await page.getByText('Comunicações').click()

  const communicationsResponse = await communicationsResponsePromise
  expect(communicationsResponse.status()).toBe(500)
  expect(await communicationsResponse.json()).toEqual({
    message: 'Internal Server Error',
  })

  await expect(page.getByText('Erro ao se conectar com a API de histórico.')).toBeVisible(
    { timeout: 15000 },
  )
  await expect(
    page.getByText('Olá, gostaria de saber sobre o meu caso.'),
  ).not.toBeVisible()
})
