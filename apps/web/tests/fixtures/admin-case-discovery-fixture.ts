import type { Page } from '@playwright/test'
import { test as authTest } from './auth-fixture'

export const ADMIN_CASE_ID = '00000000-0000-4000-8000-000000000101'
export const ADMIN_CASE_SUMMARY = {
  id: ADMIN_CASE_ID,
  publicCode: 'CASO-20261001-0001',
  title: 'Contrato civil',
  clientName: 'Cliente Administrativo',
  legalArea: 'Cível',
  legalTopic: 'Contratos',
  status: 'documentation',
  managerNames: ['Maria Gestora'],
  updatedAt: '2026-10-01T12:00:00Z',
}

export class AdminCaseDiscoveryFixture {
  readonly requests: { method: string; path: string; search: string }[] = []
  private constructor(private readonly page: Page) {}
  static register(page: Page) {
    return new AdminCaseDiscoveryFixture(page)
  }
  async mockRoutes(profile: 'admin' | 'lawyer' = 'admin') {
    await this.page.route('http://hms-api.test/**', async (route) => {
      const request = route.request()
      const url = new URL(request.url())
      this.requests.push({
        method: request.method(),
        path: url.pathname,
        search: url.search,
      })
      if (url.pathname === '/collaborators/me')
        return route.fulfill({
          json: {
            collaboratorId: '00000000-0000-4000-8000-000000000102',
            professionalName: 'Administrador HMS',
            email: 'admin@hms.test',
            profile,
            status: 'active',
            legalExpertises: [],
          },
        })
      if (url.pathname === '/cases/admin/list') {
        const page = Number(url.searchParams.get('page') ?? 1)
        const searching = Boolean(url.searchParams.get('search'))
        return route.fulfill({
          json: {
            items: [ADMIN_CASE_SUMMARY],
            page,
            pageSize: 50,
            total: searching ? 1 : 51,
            totalPages: searching ? 1 : 2,
          },
        })
      }
      if (url.pathname === `/cases/${ADMIN_CASE_ID}`)
        return route.fulfill({
          json: {
            ...ADMIN_CASE_SUMMARY,
            intakeId: 'intake-1',
            openedAt: '2026-10-01T12:00:00Z',
            checklistGate: {},
            dossierGate: {},
            team: [
              {
                collaboratorId: '00000000-0000-4000-8000-000000000103',
                name: 'Maria Gestora',
                role: 'manager',
              },
            ],
          },
        })
      return route.fulfill({ status: 404, json: { message: 'Unmocked endpoint' } })
    })
  }
}

export const test = authTest.extend<{ discovery: AdminCaseDiscoveryFixture }>({
  discovery: async ({ page }, use) => use(AdminCaseDiscoveryFixture.register(page)),
})
