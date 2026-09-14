import { expect } from '@playwright/test'

import { test } from '../../fixtures/auth-fixture'
import { ROUTES } from '../../../src/constants/routes'

const BACKEND_URL = 'http://hms-api.test'
const INTAKE_ID = 'intake-contracted'

const intake = {
  id: INTAKE_ID,
  sequenceNumber: 142,
  clientId: 'client-1',
  responsibleId: 'responsible-1',
  createdBy: 'user-1',
  updatedBy: 'user-1',
  origin: 'direct',
  contactChannel: 'email',
  legalAreaId: 'area-1',
  legalTopicId: 'topic-1',
  urgency: 'normal',
  demandNotes: 'Revisão de contrato de prestação de serviços.',
  status: 'contracted',
  version: 4,
  createdAt: '2026-08-18T12:00:00.000Z',
  updatedAt: '2026-08-19T12:00:00.000Z',
}

test('renders the contracted Intake outcome with mocked completion and case projections', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => {
    const now = new Date().toISOString()
    localStorage.setItem(
      'supabase.auth.token',
      JSON.stringify({
        access_token: 'playwright-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: 'playwright-refresh-token',
        user: {
          id: '6ecbc5b0-a145-4e0c-9167-31b54fb8318c',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'attendant@hms.test',
          email_confirmed_at: now,
          phone: '',
          app_metadata: { provider: 'email', providers: ['email'] },
          user_metadata: {},
          identities: [],
          created_at: now,
          updated_at: now,
        },
      }),
    )
  })

  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  const failedRequests: string[] = []
  const badResponses: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('requestfailed', (request) => {
    failedRequests.push(
      `${request.method()} ${request.url()}: ${request.failure()?.errorText}`,
    )
  })
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('response', (response) => {
    if (response.status() >= 400) {
      badResponses.push(`${response.status()} ${response.url()}`)
    }
  })

  await page.route('https://fonts.googleapis.com/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'text/css', body: '' })
  })
  await page.route('https://fonts.gstatic.com/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'font/woff2', body: Buffer.alloc(0) })
  })
  await page.route('http://supabase.test/auth/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/user')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '6ecbc5b0-a145-4e0c-9167-31b54fb8318c',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'attendant@hms.test',
          user_metadata: {},
          app_metadata: { provider: 'email', providers: ['email'] },
        }),
      })
      return
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  })

  await page.route(`${BACKEND_URL}/intakes/${INTAKE_ID}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(intake),
    })
  })
  await page.route(`${BACKEND_URL}/clients/client-1`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        client: {
          id: 'client-1',
          type: 'natural',
          name: 'Ana Beatriz',
          taxId: { type: 'cpf', value: '98198246304' },
          email: 'ana@example.com',
          phone: '66840566416',
          address: { city: 'Cuiabá', state: 'MT' },
        },
      }),
    })
  })
  await page.route(`${BACKEND_URL}/collaborators/responsible-1`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'responsible-1', professionalName: 'Marina Costa' }),
    })
  })
  await page.route(`${BACKEND_URL}/collaborators/me`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'responsible-1', professionalName: 'Marina Costa' }),
    })
  })
  await page.route(`${BACKEND_URL}/clients?page=1&limit=50`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [], total: 0, page: 1, limit: 50 }),
    })
  })
  await page.route(`${BACKEND_URL}/legal-catalog/areas`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 'area-1', name: 'Cível' }]),
    })
  })
  await page.route(`${BACKEND_URL}/legal-catalog/areas/area-1/topics`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 'topic-1', name: 'Contratos' }]),
    })
  })
  await page.route(`${BACKEND_URL}/intakes/clients/client-1`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    })
  })
  await page.route(
    `${BACKEND_URL}/consultations/by-intake/${INTAKE_ID}`,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null),
      })
    },
  )
  await page.route(
    `${BACKEND_URL}/formalizations/by-intake/${INTAKE_ID}/completion`,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          formalizationId: 'formalization-1',
          intakeId: INTAKE_ID,
          status: 'completed',
          completedAt: '2026-08-19T12:00:00.000Z',
          signatureRequestId: 'request-1',
          signatureStatus: 'confirmed',
        }),
      })
    },
  )
  await page.route(`${BACKEND_URL}/cases/by-intake/${INTAKE_ID}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(null),
    })
  })

  await page.goto(ROUTES.intakeDetails.replace('$intakeId', INTAKE_ID))
  await expect(page.getByRole('main', { name: 'INT-0142' })).toBeVisible({
    timeout: 30_000,
  })
  await page.waitForTimeout(250)

  await expect(page.getByRole('heading', { name: 'INT-0142' })).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Resultado da contratação' }),
  ).toBeVisible()
  await expect(page.getByText('Contratação confirmada')).toBeVisible()
  await expect(page.getByRole('link', { name: /Abrir formalização/ })).toHaveAttribute(
    'href',
    '/formalizacoes/formalization-1',
  )
  await expect(page.getByText('Nenhum caso foi iniciado para este Intake.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Abrir caso' })).toBeDisabled()

  const formalizationLink = page.getByRole('link', { name: /Abrir formalização/ })
  await formalizationLink.focus()
  await expect(formalizationLink).toBeFocused()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390)

  await page.screenshot({
    path: testInfo.outputPath('intake-contracted-mobile-mocked.png'),
    fullPage: true,
  })
  expect(consoleErrors, `console errors: ${consoleErrors.join('\n')}`).toEqual([])
  expect(pageErrors, `page errors: ${pageErrors.join('\n')}`).toEqual([])
  expect(failedRequests, `failed requests: ${failedRequests.join('\n')}`).toEqual([])
  expect(badResponses, `bad responses: ${badResponses.join('\n')}`).toEqual([])
})
