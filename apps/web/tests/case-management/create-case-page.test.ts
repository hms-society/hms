import { expect, test as playwrightTest } from '@playwright/test'
import { ROUTES } from '../../src/constants/routes'
import {
  BACKEND_URL,
  INTAKE_ID,
  PARLEGAL,
  SUGGESTED_MANAGER,
  CANDIDATE,
  ALTERNATE_CANDIDATE,
  test,
} from '../fixtures/case-opening-fixture'

const createPath = ROUTES.lawyerCaseCreation

test('creates a case with an explicit manager, auxiliary team and idempotency key', async ({
  page,
  caseManagementFixture,
}) => {
  const state = await caseManagementFixture.mockRoutes({
    openingManager: SUGGESTED_MANAGER,
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(createPath)
  await expect(page).toHaveURL(createPath)

  await page
    .getByPlaceholder('Ex: Aposentadoria por Tempo de Contribuição')
    .fill('Caso de teste de integração')
  const intakeSearch = page.getByPlaceholder(
    'Digite o nome do cliente, CPF ou ID da triagem...',
  )
  await intakeSearch.fill('Cliente')
  await page.getByRole('option', { name: /Cliente Teste/ }).click()
  await expect(page.getByText(SUGGESTED_MANAGER.professionalName)).toBeVisible()

  await page.getByRole('button', { name: 'Trocar gestor' }).focus()
  await page.keyboard.press('Enter')
  await page.getByRole('button', { name: new RegExp(CANDIDATE.professionalName) }).click()
  await page.getByRole('button', { name: 'Selecionar colaborador' }).click()
  await expect(page.locator('form').getByText(CANDIDATE.professionalName)).toBeVisible()

  await page.getByRole('button', { name: 'Adicionar membro' }).click()
  await page
    .getByRole('button', { name: new RegExp(ALTERNATE_CANDIDATE.professionalName) })
    .click()
  await page.getByRole('button', { name: 'Selecionar colaborador' }).click()
  await expect(
    page.locator('form').getByText(ALTERNATE_CANDIDATE.professionalName),
  ).toBeVisible()

  await page.screenshot({
    path: '.playwright-cli/screenshots/case-opening-mobile.png',
    fullPage: true,
  })

  const creationResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' && response.url() === `${BACKEND_URL}/cases`,
  )
  await page.getByRole('button', { name: 'Criar Caso' }).click()
  const creationResponse = await creationResponsePromise
  expect(creationResponse.status()).toBe(201)
  const requestBody = creationResponse.request().postDataJSON()
  expect(requestBody).toMatchObject({
    title: 'Caso de teste de integração',
    intakeId: INTAKE_ID,
    initialManagerCollaboratorId: CANDIDATE.collaboratorId,
    team: [{ collaboratorId: ALTERNATE_CANDIDATE.collaboratorId, role: 'collaborator' }],
  })
  expect(requestBody.operationId).toMatch(/^[0-9a-f-]{36}$/i)
  expect(
    state.requests.some(
      (request) => request.pathname === '/cases/opening-sources/' + INTAKE_ID,
    ),
  ).toBe(true)
  await expect(page).toHaveURL(ROUTES.lawyerCases)
  await expect(page.getByRole('heading', { name: 'Meus casos' })).toBeVisible()
})

test('rejects non-Lawyer actors from the create route before showing its form', async ({
  page,
  caseManagementFixture,
}) => {
  const state = await caseManagementFixture.mockRoutes({ actor: PARLEGAL })
  await page.goto(createPath)

  await expect(page).toHaveURL(new RegExp(`${ROUTES.home}$`))
  await expect(page.getByRole('heading', { name: 'Novo Caso' })).toHaveCount(0)
  expect(
    state.requests.some(
      (request) => request.method === 'POST' && request.pathname === '/cases',
    ),
  ).toBe(false)
})

playwrightTest(
  'redirects unauthenticated visitors from create case to login',
  async ({ page }) => {
    await page.goto(createPath)
    await expect(page).toHaveURL(new RegExp(`${ROUTES.login}$`))
  },
)
