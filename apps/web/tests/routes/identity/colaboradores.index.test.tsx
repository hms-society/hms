import { expect, test as playwrightTest } from '@playwright/test'

import { test } from '../../fixtures/auth-fixture'

import { ROUTES } from '../../../src/constants/routes'

import {
  ACTIVE_COLLABORATOR,
  ATTENDANT,
  BACKEND_URL,
  CANCELLED_COLLABORATOR,
  COLLABORATOR_ID,
  DISABLED_COLLABORATOR,
  INVITED_COLLABORATOR,
  confirmAction,
  mockCollaboratorRoutes,
  openCollaboratorActions,
} from './colaboradores-test-helpers'

test('preserves the final list URL and query contract for an administrator', async ({
  page,
}) => {
  await mockCollaboratorRoutes(page, {
    collaborators: [
      ACTIVE_COLLABORATOR,
      {
        ...ACTIVE_COLLABORATOR,
        collaboratorId: 'second-collaborator-id',
        professionalName: 'Maria Oliveira 2',
        email: 'maria2@example.com',
      },
    ],
  })

  const listRequestPromise = page.waitForRequest(
    (request) =>
      request.method() === 'GET' &&
      request.url().startsWith(`${BACKEND_URL}/collaborators?`),
  )

  const expectedUrl = `${ROUTES.collaborators}?search=Maria&status=active&page=2&pageSize=1`
  await page.goto(expectedUrl)

  await expect(page).toHaveURL(expectedUrl)
  await expect(page.getByRole('heading', { name: 'Colaboradores' })).toBeVisible()
  await expect(page.getByText('Maria Oliveira 2')).toBeVisible()
  await expect(page.getByText('Página 2 de 2')).toBeVisible()

  const listRequest = await listRequestPromise
  const requestUrl = new URL(listRequest.url())
  expect(requestUrl.searchParams.get('search')).toBe('Maria')
  expect(requestUrl.searchParams.get('status')).toBe('active')
  expect(requestUrl.searchParams.get('page')).toBe('2')
  expect(requestUrl.searchParams.get('pageSize')).toBe('1')
})

test('renders the action matrix for active, invited, disabled, and cancelled collaborators', async ({
  page,
}) => {
  await mockCollaboratorRoutes(page, {
    collaborators: [
      ACTIVE_COLLABORATOR,
      INVITED_COLLABORATOR,
      DISABLED_COLLABORATOR,
      CANCELLED_COLLABORATOR,
    ],
  })

  await page.goto(ROUTES.collaborators)

  await openCollaboratorActions(page, ACTIVE_COLLABORATOR.professionalName)
  await expect(page.getByRole('menuitem', { name: 'Inativar' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Reenviar convite' })).toHaveCount(0)
  await page.keyboard.press('Escape')

  await openCollaboratorActions(page, INVITED_COLLABORATOR.professionalName)
  await expect(page.getByRole('menuitem', { name: 'Reenviar convite' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Cancelar convite' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Inativar' })).toHaveCount(0)
  await page.keyboard.press('Escape')

  await openCollaboratorActions(page, DISABLED_COLLABORATOR.professionalName)
  await expect(page.getByRole('menuitem', { name: 'Reativar' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Remover colaborador' })).toHaveCount(0)
  await page.keyboard.press('Escape')

  await openCollaboratorActions(page, CANCELLED_COLLABORATOR.professionalName)
  await expect(page.getByRole('menuitem', { name: 'Remover colaborador' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Reativar' })).toHaveCount(0)
})

test('shows the loading state while the collaborators request is pending', async ({
  page,
}) => {
  await mockCollaboratorRoutes(page, { listDelayMs: 700 })

  await page.goto(ROUTES.collaborators)

  await expect(
    page.getByRole('status', { name: 'Carregando colaboradores' }),
  ).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('Maria Oliveira')).toBeVisible({ timeout: 15_000 })
})

test('shows a list error and recovers after retrying the request', async ({ page }) => {
  const state = await mockCollaboratorRoutes(page, { listError: 'List failed' })

  await page.goto(ROUTES.collaborators)

  await expect(page.getByText('Não foi possível carregar os colaboradores.')).toBeVisible(
    { timeout: 15_000 },
  )
  const retryRequestPromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'GET' &&
      new URL(response.url()).pathname === '/collaborators' &&
      response.status() === 200,
  )
  state.listError = undefined
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await retryRequestPromise

  await expect(page.getByText('Maria Oliveira')).toBeVisible()
})

test('resends an invitation with the expected POST contract', async ({ page }) => {
  const state = await mockCollaboratorRoutes(page, {
    collaborators: [INVITED_COLLABORATOR],
  })
  await page.goto(ROUTES.collaborators)
  await openCollaboratorActions(page, INVITED_COLLABORATOR.professionalName)

  const responsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.url() ===
        `${BACKEND_URL}/collaborators/${INVITED_COLLABORATOR.collaboratorId}/invitation/resend`,
  )
  await confirmAction(page, 'Reenviar convite', 'Reenviar convite')
  await expect((await responsePromise).status()).toBe(200)

  expect(state.requests.at(-1)).toEqual({
    method: 'POST',
    pathname: `/collaborators/${INVITED_COLLABORATOR.collaboratorId}/invitation/resend`,
    body: {},
  })
  await expect(page.getByText('Convite reenviado com sucesso.')).toBeVisible()
})

test('cancels an invitation, updates its status, and removes the cancelled collaborator', async ({
  page,
}) => {
  const state = await mockCollaboratorRoutes(page, {
    collaborators: [INVITED_COLLABORATOR],
  })
  await page.goto(ROUTES.collaborators)
  await openCollaboratorActions(page, INVITED_COLLABORATOR.professionalName)

  const cancelResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.url() ===
        `${BACKEND_URL}/collaborators/${INVITED_COLLABORATOR.collaboratorId}/invitation/cancel`,
  )
  await confirmAction(page, 'Cancelar convite', 'Cancelar convite')
  await expect((await cancelResponsePromise).status()).toBe(200)
  expect(state.requests.at(-1)).toEqual({
    method: 'POST',
    pathname: `/collaborators/${INVITED_COLLABORATOR.collaboratorId}/invitation/cancel`,
    body: {},
  })

  await expect(page.getByText('Desabilitado')).toBeVisible()
  await openCollaboratorActions(page, INVITED_COLLABORATOR.professionalName)
  await expect(page.getByRole('menuitem', { name: 'Remover colaborador' })).toBeVisible()

  const removeResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'DELETE' &&
      response.url() ===
        `${BACKEND_URL}/collaborators/${INVITED_COLLABORATOR.collaboratorId}`,
  )
  await confirmAction(page, 'Remover colaborador', 'Remover colaborador')
  await expect((await removeResponsePromise).status()).toBe(204)
  expect(state.requests.at(-1)).toEqual({
    method: 'DELETE',
    pathname: `/collaborators/${INVITED_COLLABORATOR.collaboratorId}`,
    body: undefined,
  })

  await expect(page.getByText('Ainda não há colaboradores')).toBeVisible()
})

test('deactivates and reactivates a collaborator through the corresponding POST contracts', async ({
  page,
}) => {
  const state = await mockCollaboratorRoutes(page, {
    collaborators: [ACTIVE_COLLABORATOR],
  })
  await page.goto(ROUTES.collaborators)
  await openCollaboratorActions(page, ACTIVE_COLLABORATOR.professionalName)

  const deactivateResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.url() ===
        `${BACKEND_URL}/collaborators/${ACTIVE_COLLABORATOR.collaboratorId}/deactivate`,
  )
  await confirmAction(page, 'Inativar', 'Inativar colaborador')
  await expect((await deactivateResponsePromise).status()).toBe(200)
  expect(state.requests.at(-1)).toEqual({
    method: 'POST',
    pathname: `/collaborators/${ACTIVE_COLLABORATOR.collaboratorId}/deactivate`,
    body: {},
  })
  await expect(page.getByText('Desabilitado')).toBeVisible()

  await openCollaboratorActions(page, ACTIVE_COLLABORATOR.professionalName)
  await expect(page.getByRole('menuitem', { name: 'Reativar' })).toBeVisible()

  const reactivateResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.url() ===
        `${BACKEND_URL}/collaborators/${ACTIVE_COLLABORATOR.collaboratorId}/reactivate`,
  )
  await confirmAction(page, 'Reativar', 'Reativar colaborador')
  await expect((await reactivateResponsePromise).status()).toBe(200)
  expect(state.requests.at(-1)).toEqual({
    method: 'POST',
    pathname: `/collaborators/${ACTIVE_COLLABORATOR.collaboratorId}/reactivate`,
    body: {},
  })
  await expect(page.getByText('Ativo')).toBeVisible()
})

test('keeps the action dialog pending and reports a mutation error', async ({ page }) => {
  await mockCollaboratorRoutes(page, {
    actionErrors: { deactivate: 'Não foi possível inativar agora.' },
    actionDelays: { deactivate: 700 },
  })
  await page.goto(ROUTES.collaborators)
  await openCollaboratorActions(page, ACTIVE_COLLABORATOR.professionalName)
  await page.getByRole('menuitem', { name: 'Inativar' }).click()

  const dialog = page.getByRole('alertdialog')
  const responsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' && response.url().endsWith('/deactivate'),
  )
  await dialog.getByRole('button', { name: 'Inativar colaborador' }).click()

  await expect(dialog.getByRole('button', { name: 'Processando…' })).toBeDisabled()
  await expect((await responsePromise).status()).toBe(500)
  await expect(dialog.getByRole('alert')).toContainText(
    'Não foi possível inativar agora.',
  )
  await expect(dialog.getByRole('button', { name: 'Cancelar' })).toBeEnabled()
})

test('edits a collaborator and sends the PATCH payload', async ({ page }) => {
  const state = await mockCollaboratorRoutes(page)
  await page.goto(ROUTES.collaborators)
  await openCollaboratorActions(page, ACTIVE_COLLABORATOR.professionalName)
  await page.getByRole('menuitem', { name: 'Editar' }).click()

  const dialog = page.getByRole('dialog', { name: 'Editar colaborador' })
  await expect(dialog).toBeVisible()
  await dialog.getByLabel('Nome profissional').fill('Maria Oliveira Atualizada')
  await dialog.getByLabel('Cargo').fill('Advogada sênior')
  await dialog.getByRole('combobox', { name: 'Perfil' }).click()
  await page.getByRole('option', { name: 'Atendente' }).click()

  const responsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'PATCH' &&
      response.url() === `${BACKEND_URL}/collaborators/${COLLABORATOR_ID}`,
  )
  await dialog.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect((await responsePromise).status()).toBe(200)

  expect(state.requests.at(-1)).toEqual({
    method: 'PATCH',
    pathname: `/collaborators/${COLLABORATOR_ID}`,
    body: {
      professionalName: 'Maria Oliveira Atualizada',
      jobTitle: 'Advogada sênior',
      profile: 'attendant',
    },
  })
  await expect(page.getByRole('dialog', { name: 'Editar colaborador' })).toHaveCount(0)
  await expect(page.getByText('Maria Oliveira Atualizada')).toBeVisible()
})

test('redirects an authenticated non-administrator away from the collaborators list', async ({
  page,
}) => {
  await mockCollaboratorRoutes(page, { currentCollaborator: ATTENDANT })

  await page.goto(ROUTES.collaborators)

  await expect(page).toHaveURL(new RegExp(`${ROUTES.home}$`))
})

playwrightTest(
  'redirects an unauthenticated user from the collaborators list to login',
  async ({ page }) => {
    await page.goto(ROUTES.collaborators)

    await expect(page).toHaveURL(new RegExp(`${ROUTES.login}$`))
  },
)
