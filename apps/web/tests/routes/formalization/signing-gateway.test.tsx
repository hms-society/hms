import { expect, test } from '@playwright/test'

const INVITATION_TOKEN = 'a'.repeat(43)
const CSRF_TOKEN = 'c'.repeat(43)

test('opens the public signing gateway and removes the invitation fragment', async ({
  page,
}) => {
  page.on('requestfailed', (request) =>
    console.log(`requestfailed ${request.url()} ${request.failure()?.errorText}`),
  )
  if (process.env.SIGNING_GATEWAY_VIEWPORT !== 'desktop')
    await page.setViewportSize({ width: 390, height: 844 })
  const exchange = page.waitForRequest((request) =>
    request.url().includes('/formalizations/signing-gateway/invitations/exchange'),
  )
  await page.route(
    '**/formalizations/signing-gateway/invitations/exchange**',
    async (route) => {
      const origin = route.request().headers().origin ?? 'http://127.0.0.1:5000'
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({
          status: 204,
          headers: {
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Headers': 'accept, content-type',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Expose-Headers': 'X-HMS-Signing-CSRF',
          },
        })
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Expose-Headers': 'X-HMS-Signing-CSRF',
          'X-HMS-Signing-CSRF': CSRF_TOKEN,
        },
        body: JSON.stringify({ step: 'invitation', csrfToken: CSRF_TOKEN }),
      })
    },
  )
  await page.route('**/formalizations/signing-gateway/context**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin':
          route.request().headers().origin ?? 'http://127.0.0.1:5000',
      },
      body: JSON.stringify({
        step: 'collaborator_login',
        loginPath: '/login?returnTo=%2Fassinaturas%2Facesso',
        csrfToken: CSRF_TOKEN,
      }),
    })
  })

  await page.goto(`/assinaturas/acesso/#${INVITATION_TOKEN}`)

  const exchangeRequest = await exchange
  expect(exchangeRequest.postDataJSON()).toEqual({ token: INVITATION_TOKEN })
  await expect(page).toHaveURL(/\/assinaturas\/acesso$/)
  await expect(
    page.getByRole('heading', { name: 'Documento para assinatura' }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByRole('heading', { name: 'Acesso do colaborador' })).toBeVisible()
  const timeOrigin = await page.evaluate(() => performance.timeOrigin)
  const loginLink = page.getByRole('link', { name: 'Entrar' })
  await expect(loginLink).toHaveAttribute(
    'href',
    '/login?returnTo=%2Fassinaturas%2Facesso',
  )
  await loginLink.click()
  await expect(page).toHaveURL('/login?returnTo=%2Fassinaturas%2Facesso')
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(timeOrigin)
})
