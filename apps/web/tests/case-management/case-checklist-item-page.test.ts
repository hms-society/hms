import { expect, test as playwrightTest } from '@playwright/test'
import { ROUTES } from '../../src/constants/routes'
import {
  BACKEND_URL,
  CASE_ID,
  ITEM_ID,
  ADMIN,
  LAWYER,
  test,
} from '../fixtures/case-detail-fixture'

const checklistPath = ROUTES.lawyerCaseChecklistItem
  .replace('$caseId', CASE_ID)
  .replace('$checklistItemId', ITEM_ID)

test('loads a checklist item for an authorized Lawyer', async ({
  page,
  caseManagementFixture,
}) => {
  const state = await caseManagementFixture.mockRoutes()
  const checklistResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'GET' &&
      response.url() === `${BACKEND_URL}/cases/${CASE_ID}/checklist`,
    { timeout: 10_000 },
  )
  await page.goto(checklistPath)

  await expect(page).toHaveURL(checklistPath)
  expect((await checklistResponsePromise).status()).toBe(200)
  await expect(
    page.getByRole('heading', { name: 'Documento de identidade' }),
  ).toBeVisible()
  expect(state.browserErrors).toEqual([])
  expect(state.responses.filter(({ status }) => status >= 400)).toEqual([])
  expect(
    state.requests.some(
      (request) =>
        request.pathname ===
        `/document-validation/documents/${'00000000-0000-4000-8000-000000000060'}`,
    ),
  ).toBe(true)
})

test('rejects Admin from the checklist route before requesting protected case documents', async ({
  page,
  caseManagementFixture,
}) => {
  const state = await caseManagementFixture.mockRoutes({ actor: ADMIN })
  await page.goto(checklistPath)

  await expect(page).toHaveURL(new RegExp(`${ROUTES.home}$`))
  expect(state.requests.some((request) => request.pathname.endsWith('/checklist'))).toBe(
    false,
  )
  expect(
    state.requests.some((request) =>
      request.pathname.includes('/document-validation/documents/'),
    ),
  ).toBe(false)
})

playwrightTest(
  'redirects unauthenticated visitors from checklist detail to login',
  async ({ page }) => {
    await page.goto(checklistPath)
    await expect(page).toHaveURL(new RegExp(`${ROUTES.login}$`))
  },
)

for (const actor of [LAWYER, ADMIN]) {
  test(`keeps ${actor.profile} case content usable on a narrow keyboard path`, async ({
    page,
    caseManagementFixture,
  }) => {
    const state = await caseManagementFixture.mockRoutes({ actor })
    await page.setViewportSize({ width: 390, height: 844 })
    const casePath = ROUTES.lawyerCaseDetails.replace('$caseId', CASE_ID)
    await page.goto(casePath)
    await expect(
      page.getByRole('heading', { name: 'Ação previdenciária de teste' }),
    ).toBeVisible({ timeout: 15_000 })
    await page.getByRole('tab', { name: /Checklist & Dossiê/ }).focus()
    await page.keyboard.press('Enter')
    await expect(
      page.getByRole('button', { name: 'Abrir Documento de identidade' }),
    ).toHaveCount(actor === ADMIN ? 0 : 1)
    await page.screenshot({
      path: `.playwright-cli/screenshots/case-detail-${actor.profile}-checklist-mobile.png`,
      fullPage: true,
    })
    if (actor === ADMIN) {
      for (const [tab, heading] of [
        ['Prazos & Tarefas', 'Prazos e tarefas'],
        ['Peças', 'Produção Jurídica'],
      ]) {
        await page.getByRole('tab', { name: tab }).click()
        await expect(
          page.getByRole('heading', { name: heading, exact: true }),
        ).toBeVisible()
      }
      expect(state.requests.filter((request) => request.method !== 'GET')).toEqual([])
      expect(state.browserErrors).toEqual([])
      expect(state.responses.filter(({ status }) => status >= 400)).toEqual([])
    }
    expect(
      state.requests.some(
        (request) => request.pathname === `/cases/${CASE_ID}/checklist`,
      ),
    ).toBe(true)
  })
}
