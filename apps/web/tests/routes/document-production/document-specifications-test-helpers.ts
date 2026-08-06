import type { Page } from '@playwright/test'

export const DOCUMENT_PRODUCTION_BACKEND = 'http://hms-api.test'

const emptyContent = {
  type: 'doc',
  content: [{ type: 'paragraph', attrs: { textAlign: null } }],
}

export const documentSpecificationDetails = {
  documentSpecificationId: 'spec-1',
  name: 'Procuração',
  description: 'Documento de representação',
  application: { scope: 'global', moment: 'consultation' },
  isRequired: true,
  status: 'available',
  content: emptyContent,
  variables: [],
  updatedAt: '2026-01-01T00:00:00.000Z',
}

export async function createStatefulDocumentSpecificationRoutes(page: Page) {
  const state = {
    details: { ...documentSpecificationDetails },
    listRequests: 0,
    getRequests: 0,
    patchRequests: 0,
    createRequests: 0,
  }

  await page.route(`${DOCUMENT_PRODUCTION_BACKEND}/**`, async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.pathname === '/collaborators/me') {
      await route.fulfill({
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
      return
    }
    if (url.pathname === '/legal-catalog/areas') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'area-1', name: 'Trabalhista', active: true }]),
      })
      return
    }
    if (url.pathname === '/legal-catalog/areas/area-1/topics') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'topic-1', legalAreaId: 'area-1', name: 'Contratos', active: true },
        ]),
      })
      return
    }
    if (url.pathname === '/document-specifications' && request.method() === 'GET') {
      state.listRequests += 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [state.details],
          page: Number(url.searchParams.get('page') ?? 1),
          pageSize: Number(url.searchParams.get('pageSize') ?? 20),
          total: 1,
          totalPages: 1,
        }),
      })
      return
    }
    if (url.pathname === '/document-specifications' && request.method() === 'POST') {
      state.createRequests += 1
      const requestBody = request.postDataJSON() as Record<string, unknown>
      state.details = {
        ...state.details,
        documentSpecificationId: 'created-specification',
        name: String(requestBody.name),
        description: String(requestBody.description),
        application: requestBody.application as typeof state.details.application,
        isRequired: Boolean(requestBody.isRequired),
        status: 'unavailable',
      }
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(state.details),
      })
      return
    }
    if (
      url.pathname === `/document-specifications/${state.details.documentSpecificationId}`
    ) {
      state.getRequests += 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(state.details),
      })
      return
    }
    if (url.pathname.endsWith('/configuration') && request.method() === 'PATCH') {
      state.patchRequests += 1
      state.details = { ...state.details, ...(request.postDataJSON() as object) }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(state.details),
      })
      return
    }
    await route.continue()
  })

  return state
}

export async function mockDocumentSpecificationRoutes(page: Page) {
  await page.route(`${DOCUMENT_PRODUCTION_BACKEND}/**`, async (route) => {
    const url = new URL(route.request().url())
    if (url.pathname === '/collaborators/me') {
      await route.fulfill({
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
      return
    }
    if (url.pathname === '/legal-catalog/areas') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'area-1', name: 'Trabalhista', active: true }]),
      })
      return
    }
    if (url.pathname === '/legal-catalog/areas/area-1/topics') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'topic-1', legalAreaId: 'area-1', name: 'Contratos', active: true },
        ]),
      })
      return
    }
    if (url.pathname === '/document-specifications') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              documentSpecificationId: 'spec-1',
              name: 'Procuração',
              description: 'Documento de representação',
              application: { scope: 'global', moment: 'consultation' },
              isRequired: true,
              status: 'available',
            },
          ],
          page: Number(url.searchParams.get('page') ?? 1),
          pageSize: Number(url.searchParams.get('pageSize') ?? 20),
          total: 1,
          totalPages: 1,
        }),
      })
      return
    }
    await route.continue()
  })
}
