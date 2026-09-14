import { expect } from '@playwright/test'

import { test } from '../../fixtures/auth-fixture'
import { ROUTES } from '../../../src/constants/routes'

const BACKEND = 'http://hms-api.test'
const FORM_ID = '11111111-1111-4111-8111-111111111111'

const form = {
  id: FORM_ID,
  name: 'Triagem inicial',
  description: 'Dados da consulta',
  status: 'available',
  stage: 'consultation',
  legalArea: { id: 'area-1', name: 'Cível' },
  legalTopics: [{ id: 'topic-1', name: 'Contratos', position: 0 }],
  fieldCount: 3,
}

test('renders the protected administration list and sends URL-owned filters', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.route(`${BACKEND}/collaborators/me`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        collaboratorId: 'admin',
        professionalName: 'Admin',
        email: 'admin@hms.test',
        profile: 'admin',
        status: 'active',
      }),
    }),
  )
  await page.route(`${BACKEND}/**`, (route) => {
    const pathname = new URL(route.request().url()).pathname
    if (pathname === '/collaborators/me') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          collaboratorId: 'admin',
          professionalName: 'Admin',
          email: 'admin@hms.test',
          profile: 'admin',
          status: 'active',
        }),
      })
    }
    if (!pathname.startsWith('/legal-catalog/dynamic-forms')) return route.continue()
    if (route.request().method() !== 'GET') return route.continue()
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [form],
        page: 1,
        pageSize: 5,
        total: 1,
        pageCount: 1,
      }),
    })
  })

  await page.goto(`${ROUTES.dynamicForms}?search=Triagem`)
  await expect(page).toHaveURL(`${ROUTES.dynamicForms}?search=Triagem&page=1&pageSize=5`)
  await expect(page.getByRole('heading', { name: 'Formulários dinâmicos' })).toBeVisible()
  await expect(page.getByText('Triagem inicial', { exact: true }).last()).toBeVisible()
  for (const column of [
    'Formulário',
    'Etapa',
    'Área jurídica',
    'Temas',
    'Campos',
    'Estado',
    'Ações',
  ]) {
    await expect(page.getByRole('columnheader', { name: column })).toBeVisible()
  }
  await expect(page.getByRole('button', { name: 'Editar' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Novo formulário' })).toBeVisible()

  const viewportWidth = 1440
  const actionHeaderBox = await page
    .getByRole('columnheader', { name: 'Ações' })
    .boundingBox()
  const editButtonBox = await page.getByRole('button', { name: 'Editar' }).boundingBox()

  expect(actionHeaderBox).not.toBeNull()
  expect(editButtonBox).not.toBeNull()
  expect(actionHeaderBox!.x + actionHeaderBox!.width).toBeLessThanOrEqual(viewportWidth)
  expect(editButtonBox!.x + editButtonBox!.width).toBeLessThanOrEqual(viewportWidth)
})

test('restores row-menu focus and exposes authoritative duplicate conflict metadata', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 })
  await page.route(`${BACKEND}/collaborators/me`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        collaboratorId: 'admin',
        professionalName: 'Admin',
        email: 'admin@hms.test',
        profile: 'admin',
        status: 'active',
      }),
    }),
  )
  await page.route(`${BACKEND}/**`, (route) => {
    const pathname = new URL(route.request().url()).pathname
    if (pathname === '/collaborators/me') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          collaboratorId: 'admin',
          professionalName: 'Admin',
          email: 'admin@hms.test',
          profile: 'admin',
          status: 'active',
        }),
      })
    }
    if (!pathname.startsWith('/legal-catalog/dynamic-forms')) return route.continue()
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Já existe um formulário com este nome.',
          metadata: { existingDynamicFormId: FORM_ID },
        }),
      })
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [form],
        page: 1,
        pageSize: 5,
        total: 1,
        pageCount: 1,
      }),
    })
  })
  await page.route(`${BACKEND}/legal-catalog/dynamic-form-name-conflicts**`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ conflict: false, existingDynamicFormId: null }),
    }),
  )

  await page.goto(ROUTES.dynamicForms)
  const actions = page.getByRole('button', { name: 'Ações de Triagem inicial' })
  await actions.click()
  await page.keyboard.press('Escape')
  await expect(actions).toBeFocused()

  await actions.click()
  await page.getByRole('menuitem', { name: 'Duplicar formulário' }).click()
  await page.getByLabel('Nome do novo formulário *').fill('Nome já usado')
  await page.getByRole('button', { name: 'Duplicar formulário' }).click()

  await expect(page.getByRole('alert').first()).toContainText('Já existe um formulário')
  await expect(page.getByRole('button', { name: 'Abrir formulário' })).toBeVisible()
  await page.getByRole('button', { name: 'Abrir formulário' }).click()
  await expect(page).toHaveURL(ROUTES.dynamicForm.replace('$dynamicFormId', FORM_ID))
  await expect(page.getByRole('heading', { name: 'Editar formulário' })).toBeVisible()
})

test('announces a successful duplicate through the live region', async ({ page }) => {
  await page.route(`${BACKEND}/collaborators/me`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        collaboratorId: 'admin',
        professionalName: 'Admin',
        email: 'admin@hms.test',
        profile: 'admin',
        status: 'active',
      }),
    }),
  )
  await page.route(`${BACKEND}/**`, (route) => {
    const pathname = new URL(route.request().url()).pathname
    if (pathname === '/collaborators/me') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          collaboratorId: 'admin',
          professionalName: 'Admin',
          email: 'admin@hms.test',
          profile: 'admin',
          status: 'active',
        }),
      })
    }
    if (!pathname.startsWith('/legal-catalog/dynamic-forms')) return route.continue()
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          ...form,
          id: '22222222-2222-4222-8222-222222222222',
          name: 'Novo nome',
        }),
      })
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [form],
        page: 1,
        pageSize: 5,
        total: 1,
        pageCount: 1,
      }),
    })
  })
  await page.route(`${BACKEND}/legal-catalog/dynamic-form-name-conflicts**`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ conflict: false, existingDynamicFormId: null }),
    }),
  )

  await page.goto(ROUTES.dynamicForms)
  await page.getByRole('button', { name: 'Ações de Triagem inicial' }).click()
  await page.getByRole('menuitem', { name: 'Duplicar formulário' }).click()
  await page.getByLabel('Nome do novo formulário *').fill('Novo nome')
  await page.getByRole('button', { name: 'Duplicar formulário' }).click()

  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(
    page.getByText('Formulário duplicado com sucesso.', { exact: true }),
  ).toBeAttached()
})
