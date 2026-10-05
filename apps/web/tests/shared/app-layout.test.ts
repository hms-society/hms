// Mocked layout integration: identity-fixture provides local auth and REST responses.
import { expect } from '@playwright/test'

import { ROUTES } from '../../src/constants/routes'
import { ATTENDANT, test } from '../fixtures/identity-fixture'

test('renders the administrator shell and marks the current page in navigation', async ({
  page,
  identityFixture,
}) => {
  await identityFixture.mockCollaboratorRoutes()

  await page.goto(ROUTES.collaborators)

  expect(new URL(page.url()).pathname).toBe(ROUTES.collaborators)
  await expect(page.getByRole('heading', { name: 'Colaboradores' })).toBeVisible()

  const mainNavigation = page.getByRole('complementary', { name: 'Navegação principal' })
  await expect(mainNavigation).toBeVisible()
  await expect(
    mainNavigation.getByRole('link', { name: 'Colaboradores' }),
  ).toHaveAttribute('aria-current', 'page')
  await expect(
    mainNavigation.getByRole('link', { name: 'Áreas e Demandas' }),
  ).toBeVisible()
})

test('renders navigation for the authenticated attendant profile', async ({
  page,
  identityFixture,
}) => {
  await identityFixture.mockCollaboratorRoutes({ currentCollaborator: ATTENDANT })

  await page.goto(ROUTES.attendantDashboard)

  await expect(page).toHaveURL(ROUTES.attendantDashboard)
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

  const mainNavigation = page.getByRole('complementary', { name: 'Navegação principal' })
  await expect(mainNavigation.getByRole('link', { name: 'Intakes' })).toBeVisible()
  await expect(mainNavigation.getByRole('link', { name: 'Consultas' })).toBeVisible()
  await expect(mainNavigation.getByRole('link', { name: 'Colaboradores' })).toHaveCount(0)
})

test('collapses the sidebar through its keyboard control', async ({
  page,
  identityFixture,
}) => {
  await identityFixture.mockCollaboratorRoutes()

  await page.goto(ROUTES.collaborators)

  const collapseButton = page.getByRole('button', { name: 'Retrair menu lateral' })
  await collapseButton.focus()
  await page.keyboard.press('Enter')

  await expect(page.getByRole('button', { name: 'Expandir menu lateral' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Colaboradores' })).toHaveAttribute(
    'title',
    'Colaboradores',
  )
})
