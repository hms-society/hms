import { expect } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { ROUTES } from '../../src/constants/routes'
import { ADMIN_CASE_ID, test } from '../fixtures/admin-case-discovery-fixture'

test('Admin searches all Cases, changes page and opens read-only metadata by keyboard on mobile', async ({
  page,
  discovery,
}) => {
  await discovery.mockRoutes()
  await page.goto(ROUTES.adminCases)
  await expect(page.getByRole('heading', { name: 'Meus casos' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Abrir novo caso' })).toHaveCount(0)
  await expect(page.getByText('51 casos disponíveis para sua equipe')).toBeVisible()
  await expect(
    page.getByText('Filtros de status e área se aplicam aos casos desta página.'),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Próxima' }).click()
  await expect(page).toHaveURL(/page=2/)
  await page.getByPlaceholder('Buscar por caso, cliente ou código...').fill('Contrato')
  await expect(page).toHaveURL(/search=Contrato/)
  await expect(page).toHaveURL(/page=1/)
  expect(
    discovery.requests.some(
      (entry) =>
        entry.path === '/cases/admin/list' && entry.search.includes('search=Contrato'),
    ),
  ).toBe(true)
  await mkdir('.playwright-cli/screenshots', { recursive: true })
  await page.screenshot({
    path: '.playwright-cli/screenshots/discovery-admin-list-desktop.png',
    fullPage: true,
  })
  await page.setViewportSize({ width: 390, height: 844 })
  const caseLink = page.getByRole('link', { name: /Contrato civil CASO-20261001-0001/ })
  await caseLink.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(ROUTES.adminCaseDetails.replace('$caseId', ADMIN_CASE_ID))
  await expect(page.getByRole('heading', { name: 'Contrato civil' })).toBeVisible()
  await expect(page.getByText('Cliente Administrativo')).toBeVisible()
  await expect(page.getByText('Maria Gestora')).toBeVisible()
  await expect(page.getByText('Somente leitura')).toBeVisible()
  await expect(
    page.getByRole('button', { name: /Adicionar|Dispensar|Aprovar|Remover/ }),
  ).toHaveCount(0)
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390)
  await page.screenshot({
    path: '.playwright-cli/screenshots/discovery-admin-summary-mobile.png',
    fullPage: true,
  })
  expect(
    discovery.requests
      .filter((entry) => entry.path.startsWith('/cases'))
      .every((entry) => entry.method === 'GET'),
  ).toBe(true)
  expect(discovery.requests.some((entry) => entry.path === '/cases/my')).toBe(false)
})

test('non-Admin cannot enter the discovery list or detail route', async ({
  page,
  discovery,
}) => {
  await discovery.mockRoutes('lawyer')
  await page.goto(ROUTES.adminCases)
  await expect(page).not.toHaveURL(/\/admin\/casos/)
  await page.goto(ROUTES.adminCaseDetails.replace('$caseId', ADMIN_CASE_ID))
  await expect(page).not.toHaveURL(/\/admin\/casos/)
  expect(
    discovery.requests.some(
      (entry) =>
        entry.path === '/cases/admin/list' || entry.path === `/cases/${ADMIN_CASE_ID}`,
    ),
  ).toBe(false)
})
