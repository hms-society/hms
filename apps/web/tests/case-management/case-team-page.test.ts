import { expect, test as playwrightTest } from '@playwright/test'
import { ROUTES } from '../../src/constants/routes'
import {
  BACKEND_URL,
  CASE_ID,
  CANDIDATE,
  LAWYER,
  type CaseActor,
  TEAM_MEMBER,
  test,
} from '../fixtures/case-team-fixture'

const casePath = ROUTES.lawyerCaseDetails.replace('$caseId', CASE_ID)

test('preserves the legal case header and supports the Team tab and professional profile at narrow width', async ({
  page,
  caseManagementFixture,
}) => {
  const state = await caseManagementFixture.mockRoutes()
  await page.setViewportSize({ width: 390, height: 844 })
  const teamResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'GET' &&
      response.url() === `${BACKEND_URL}/cases/${CASE_ID}/team`,
  )
  const legalCasesResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'GET' &&
      response.url() === `${BACKEND_URL}/cases/my`,
  )

  await page.goto(casePath)
  await expect(page).toHaveURL(casePath)
  expect((await legalCasesResponsePromise).status()).toBe(200)
  await expect(
    page.getByRole('heading', { name: 'Ação previdenciária de teste' }),
  ).toBeVisible()
  const teamTab = page.getByRole('tab', { name: 'Equipe' })
  await teamTab.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Equipe do caso' })).toBeVisible()
  await expect(page.getByText(TEAM_MEMBER.professionalName)).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Ação previdenciária de teste' }),
  ).toBeVisible()
  expect((await teamResponsePromise).status()).toBe(200)

  const actions = page.getByRole('button', {
    name: `Ações para ${TEAM_MEMBER.professionalName}`,
  })
  await actions.focus()
  await page.keyboard.press('Enter')
  const viewProfile = page.getByRole('menuitem', { name: 'Ver perfil' })
  await expect(viewProfile).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(actions).toBeFocused()
  await actions.click()
  await page.getByRole('menuitem', { name: 'Ver perfil' }).click()

  await expect(page).toHaveURL(
    new RegExp(`/colaboradores/${TEAM_MEMBER.collaboratorId}$`),
  )
  await expect(
    page.getByRole('heading', { name: TEAM_MEMBER.professionalName }),
  ).toBeVisible()
  await expect(page.getByText(TEAM_MEMBER.email)).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Especialidades jurídicas' }),
  ).toBeVisible()
  expect(
    state.requests.some(
      (request) =>
        request.pathname ===
        `/collaborators/${TEAM_MEMBER.collaboratorId}/professional-profile`,
    ),
  ).toBe(true)
  expect(
    state.requests.some(
      (request) => request.pathname === `/collaborators/${TEAM_MEMBER.collaboratorId}`,
    ),
  ).toBe(false)
})

test('closed cases expose team in read-only mode without write controls or a history card', async ({
  page,
  caseManagementFixture,
}) => {
  const state = await caseManagementFixture.mockRoutes({ caseStatus: 'closed' })
  await page.goto(casePath)
  await page.getByRole('tab', { name: 'Equipe' }).click()

  await expect(page.getByRole('status')).toContainText('Caso encerrado')
  await expect(page.getByRole('button', { name: 'Adicionar colaborador' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Histórico da equipe/ })).toHaveCount(0)
  expect(
    state.requests.some((request) =>
      ['POST', 'PATCH', 'DELETE'].includes(request.method),
    ),
  ).toBe(false)
})

test('keeps the collaborator selector within a narrow viewport without horizontal overflow', async ({
  page,
  caseManagementFixture,
}) => {
  await caseManagementFixture.mockRoutes()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.route('**/cases/team-candidates*', async (route) => {
    const items = Array.from({ length: 8 }, (_, index) => ({
      collaboratorId: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
      professionalName: `Dra. Carla Candidata ${index + 1}`,
      email: `carla${index + 1}@example.test`,
      profile: 'lawyer',
      status: 'active',
    }))
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items, page: 1, pageSize: 20, total: 8, totalPages: 1 }),
    })
  })
  await page.goto(casePath)
  await page.getByRole('tab', { name: 'Equipe' }).click()
  await page.getByRole('button', { name: 'Adicionar colaborador' }).click()

  const selectorDialog = page.getByRole('dialog', {
    name: 'Selecionar colaborador',
  })
  await expect(selectorDialog).toBeVisible()
  await expect(
    selectorDialog.getByRole('heading', { name: 'Selecionar colaborador' }),
  ).toBeInViewport()
  await expect(
    selectorDialog.getByRole('button', { name: 'Dra. Carla Candidata 1' }),
  ).toBeInViewport()
  await expect(
    selectorDialog.getByRole('combobox', { name: 'Nível na equipe' }),
  ).toBeVisible()
  await expect(selectorDialog.getByRole('combobox', { name: 'Perfil' })).toBeVisible()
  await expect(
    selectorDialog.getByRole('button', { name: 'Cancelar' }).first(),
  ).toBeInViewport()

  const scrollState = await page.evaluate(() => {
    const dialog = document.querySelector('[data-slot="dialog-content"]')
    if (!dialog) return null

    const scrollableElements = [dialog, ...dialog.querySelectorAll('*')].filter(
      (element) =>
        ['auto', 'scroll'].includes(getComputedStyle(element).overflowY) &&
        element.scrollHeight > element.clientHeight,
    )

    return {
      hasHorizontalOverflow:
        document.documentElement.scrollWidth > document.documentElement.clientWidth ||
        dialog.scrollWidth > dialog.clientWidth,
      verticalScrollRegionCount: scrollableElements.length,
    }
  })
  expect(scrollState?.hasHorizontalOverflow).toBe(false)
  expect(scrollState?.verticalScrollRegionCount).toBe(1)
})

playwrightTest(
  'redirects unauthenticated visitors from the Team route to login',
  async ({ page }) => {
    await page.goto(casePath)
    await expect(page).toHaveURL(new RegExp(`${ROUTES.login}$`))
  },
)

for (const actor of [
  { ...LAWYER, status: 'disabled' },
  { ...LAWYER, profile: 'attendant' },
] satisfies CaseActor[]) {
  test(`rejects ${actor.status} ${actor.profile} before requesting case content`, async ({
    page,
    caseManagementFixture,
  }) => {
    const state = await caseManagementFixture.mockRoutes({ actor })
    await page.goto(casePath)

    await expect(page).toHaveURL(new RegExp(`${ROUTES.home}$`))
    await expect(page.getByRole('heading', { name: 'Equipe do caso' })).toHaveCount(0)
    expect(state.requests.some((request) => request.pathname.startsWith('/cases'))).toBe(
      false,
    )
  })
}

test('rejects a legal actor without a current eligible membership before loading legal content', async ({
  page,
  caseManagementFixture,
}) => {
  const state = await caseManagementFixture.mockRoutes({ members: [] })
  await page.goto(casePath)

  await expect(page).toHaveURL(new RegExp(`${ROUTES.home}$`))
  await expect(page.getByText('Ação previdenciária de teste')).toHaveCount(0)
  expect(
    state.requests.some((request) => request.pathname === `/cases/${CASE_ID}/team`),
  ).toBe(true)
  expect(state.requests.some((request) => request.pathname === '/cases/my')).toBe(false)
  expect(state.requests.some((request) => request.pathname.endsWith('/checklist'))).toBe(
    false,
  )
})

test('redirects when the contextual access check returns 403 without loading legal content', async ({
  page,
  caseManagementFixture,
}) => {
  const state = await caseManagementFixture.mockRoutes({ caseTeamStatus: 403 })
  await page.goto(casePath)

  await expect(page).toHaveURL(new RegExp(`${ROUTES.home}$`))
  await expect(page.getByText('Ação previdenciária de teste')).toHaveCount(0)
  expect(state.requests.some((request) => request.pathname === '/cases/my')).toBe(false)
  expect(state.requests.some((request) => request.pathname.endsWith('/checklist'))).toBe(
    false,
  )
})

test('failed contextual access verification hides protected content and can recover through retry', async ({
  page,
  caseManagementFixture,
}) => {
  const options = { caseTeamStatus: 503 }
  const state = await caseManagementFixture.mockRoutes(options)
  await page.goto(casePath)

  await expect(page).toHaveURL(casePath)
  await expect(
    page.getByRole('heading', { name: 'Não foi possível verificar seu acesso' }),
  ).toBeVisible()
  await expect(page.getByText('Ação previdenciária de teste')).toHaveCount(0)
  expect(state.requests.some((request) => request.pathname === '/cases/my')).toBe(false)

  options.caseTeamStatus = 200
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page).toHaveURL(casePath)
  await expect(
    page.getByRole('heading', { name: 'Ação previdenciária de teste' }),
  ).toBeVisible()
  await page.getByRole('tab', { name: 'Equipe' }).click()
  await expect(page.getByRole('heading', { name: 'Equipe do caso' })).toBeVisible()
  expect(
    state.requests.filter((request) => request.pathname === `/cases/${CASE_ID}/team`)
      .length,
  ).toBeGreaterThanOrEqual(2)
})

// A team read can be denied after the route has already authorized legal-case access.
test('shows a team access error after the server returns 403 on the protected read', async ({
  page,
  caseManagementFixture,
}) => {
  const state = await caseManagementFixture.mockRoutes({ actor: LAWYER })
  let teamReads = 0
  await page.route(`${BACKEND_URL}/cases/${CASE_ID}/team`, async (route) => {
    teamReads += 1
    if (teamReads === 1) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          caseId: CASE_ID,
          publicCode: 'CASO-20261001-0001',
          status: 'documentation',
          teamVersion: 3,
          members: [TEAM_MEMBER],
          total: 1,
          activeManagerCount: 1,
          canManage: false,
          requiresAdministrativeReason: false,
        }),
      })
      return
    }
    await route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Forbidden' }),
    })
  })

  await page.goto(casePath)
  const deniedTeamResponse = page.waitForResponse(
    (response) =>
      response.request().method() === 'GET' &&
      response.url() === `${BACKEND_URL}/cases/${CASE_ID}/team` &&
      response.status() === 403,
  )
  await page.getByRole('tab', { name: 'Equipe' }).click()
  await deniedTeamResponse
  await expect(page.getByRole('alert')).toContainText(
    'Não foi possível carregar a equipe.',
  )
  const failedResponses = state.responses.filter(({ status }) => status >= 400)
  expect(failedResponses.length).toBeGreaterThan(0)
  expect(
    failedResponses.every(
      ({ pathname, status }) => pathname === `/cases/${CASE_ID}/team` && status === 403,
    ),
    `Unexpected failed REST responses: ${JSON.stringify(failedResponses)}`,
  ).toBe(true)
  expect(state.browserErrors).toEqual([])
  expect(
    state.requests.some(
      ({ method, pathname }) =>
        ['POST', 'PATCH', 'DELETE'].includes(method) &&
        pathname.startsWith(`/cases/${CASE_ID}/team`),
    ),
  ).toBe(false)
})

test('the case team page does not render a Team History card', async ({
  page,
  caseManagementFixture,
}) => {
  const state = await caseManagementFixture.mockRoutes()
  await page.goto(casePath)
  await page.getByRole('tab', { name: 'Equipe' }).click()
  await expect(page.getByRole('heading', { name: 'Equipe do caso' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Histórico da equipe/ })).toHaveCount(0)
  expect(
    state.requests.some(
      (request) => request.pathname === `/cases/${CASE_ID}/team/history`,
    ),
  ).toBe(false)
})

test('adds a collaborator through confirmation and refreshes the team', async ({
  page,
  caseManagementFixture,
}) => {
  const state = await caseManagementFixture.mockRoutes()
  await page.goto(casePath)
  await page.getByRole('tab', { name: 'Equipe' }).click()
  await page.getByRole('button', { name: 'Adicionar colaborador' }).click()
  await page.getByRole('button', { name: CANDIDATE.professionalName }).click()
  await page.getByRole('button', { name: 'Selecionar colaborador' }).click()
  await page.getByRole('button', { name: 'Confirmar' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByText(CANDIDATE.professionalName)).toBeVisible()
  expect(
    state.requests.find(
      (request) =>
        request.method === 'POST' && request.pathname === `/cases/${CASE_ID}/team`,
    )?.body,
  ).toMatchObject({
    collaboratorId: CANDIDATE.collaboratorId,
    role: 'collaborator',
    expectedTeamVersion: 3,
    operationId: expect.any(String),
  })
  await page.screenshot({
    path: '.playwright-cli/screenshots/case-team-after-add.png',
    fullPage: true,
  })
})
