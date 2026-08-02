import { expect } from '@playwright/test'
import { test } from '../../fixtures/auth-fixture'

const BACKEND_URL = 'http://hms-api.test'
const CLIENT_ID = '1aca4870-15a9-41f2-a23d-b4f7e2a9c8b0'

test.beforeEach(async ({ page }) => {
  await page.route(`${BACKEND_URL}/clients/${CLIENT_ID}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        client: {
          id: CLIENT_ID,
          type: 'natural',
          name: 'Kristie Friesen',
          taxId: { type: 'cpf', value: '09208262456' },
          phone: '2298775242',
          email: 'Kasey_Considine@hotmail.com',
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

  await page.route(`${BACKEND_URL}/communications/clients/${CLIENT_ID}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'msg-1',
          channel: 'whatsapp',
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
        }
      ]),
    })
  })
})

test('renders client details and communications in the correct tab', async ({ page }) => {
  await page.goto(`/clientes/${CLIENT_ID}`)

  await expect(page.getByRole('heading', { name: 'Kristie Friesen' })).toBeVisible()
  await expect(page.getByText('092.082.624-56')).toBeVisible()

  await page.getByText('Comunicações').click()

  await expect(page.getByText('Olá, gostaria de saber sobre o meu caso.')).toBeVisible()
  await expect(page.getByText('Prezada Kristie, enviamos a documentação anexa.')).toBeVisible()
})

test('filters communications by selected channel', async ({ page }) => {
  await page.goto(`/clientes/${CLIENT_ID}`)
  await page.getByText('Comunicações').click()

  await expect(page.getByText('Olá, gostaria de saber sobre o meu caso.')).toBeVisible()

  await page.getByRole('combobox').filter({ hasText: 'Todos os canais' }).click()
  await page.getByRole('option', { name: 'WhatsApp' }).click()

  await expect(page.getByText('Olá, gostaria de saber sobre o meu caso.')).toBeVisible()
  await expect(page.getByText('Prezada Kristie, enviamos a documentação anexa.')).not.toBeVisible()
})

test('filters communications by selected type', async ({ page }) => {
  await page.goto(`/clientes/${CLIENT_ID}`)
  await page.getByText('Comunicações').click()

  await expect(page.getByText('Olá, gostaria de saber sobre o meu caso.')).toBeVisible()

  await page.getByRole('combobox').filter({ hasText: 'Todos os tipos' }).click()
  await page.getByRole('option', { name: 'Recebidas' }).click()

  await expect(page.getByText('Olá, gostaria de saber sobre o meu caso.')).toBeVisible()
  await expect(page.getByText('Prezada Kristie, enviamos a documentação anexa.')).not.toBeVisible()
})

test('filters communications by selected period', async ({ page }) => {
  await page.goto(`/clientes/${CLIENT_ID}`)
  await page.getByText('Comunicações').click()

  await expect(page.getByText('Prezada Kristie, enviamos a documentação anexa.')).toBeVisible()

  await page.getByRole('combobox').filter({ hasText: 'Todo o período' }).click()
  await page.getByRole('option', { name: 'Últimos 7 dias' }).click()

  await expect(page.getByText('Olá, gostaria de saber sobre o meu caso.')).toBeVisible()
  await expect(page.getByText('Prezada Kristie, enviamos a documentação anexa.')).not.toBeVisible()
})

test('displays empty state message when no communications match filters', async ({ page }) => {
  await page.goto(`/clientes/${CLIENT_ID}`)
  await page.getByText('Comunicações').click()

  await page.getByRole('combobox').filter({ hasText: 'Todos os canais' }).click()
  await page.getByRole('option', { name: 'WhatsApp' }).click()

  await page.getByRole('combobox').filter({ hasText: 'Todos os tipos' }).click()
  await page.getByRole('option', { name: 'Enviadas' }).click()

  await expect(page.getByText('Olá, gostaria de saber sobre o meu caso.')).not.toBeVisible()
  await expect(page.getByText('Prezada Kristie, enviamos a documentação anexa.')).not.toBeVisible()
  await expect(page.getByText('Nenhuma comunicação encontrada com os filtros selecionados.')).toBeVisible()
})

test('displays error message when communication API fails', async ({ page }) => {
  await page.route(`${BACKEND_URL}/communications/clients/${CLIENT_ID}`, async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Internal Server Error' }),
    })
  })

  await page.goto(`/clientes/${CLIENT_ID}`)
  await page.getByText('Comunicações').click()

  await expect(page.getByText('Erro ao se conectar com a API de histórico.')).toBeVisible({ timeout: 15000 })
  await expect(page.getByText('Olá, gostaria de saber sobre o meu caso.')).not.toBeVisible()
})