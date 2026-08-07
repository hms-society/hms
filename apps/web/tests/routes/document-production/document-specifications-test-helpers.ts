import type { Page } from '@playwright/test'

export const DOCUMENT_PRODUCTION_BACKEND = 'http://hms-api.test'

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
