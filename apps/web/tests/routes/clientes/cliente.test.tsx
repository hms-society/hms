import { expect, test } from '@playwright/test'

const CLIENT_ID = '1aca4870-15a9-41f2-a23d-b4f7e2a9c8b0'
const BACKEND_URL = 'http://hms-api.test'

test.describe('Página de Cliente', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`${BACKEND_URL}/clients/${CLIENT_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          client: {
            id: CLIENT_ID,
            type: 'natural',
            name: 'Cliente Integração',
            taxId: {
              type: 'cpf',
              value: '11122233344',
            },
            phone: '11999999999',
            email: 'cliente@teste.com',
          },
          consents: [],
        }),
      })
    })
  })

  test('deve carregar a página e exibir os dados do cliente', async ({ page }) => {
    await page.goto(`/clientes/${CLIENT_ID}`)

    await expect(page.getByRole('heading', { name: 'Cliente Integração' })).toBeVisible()

    await expect(page.getByText('111.222.333-44')).toBeVisible()
  })
})
