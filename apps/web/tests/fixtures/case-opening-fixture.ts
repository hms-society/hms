import type { Page } from '@playwright/test'
import { test as authFixtureTest } from './auth-fixture'
export const BACKEND_URL = 'http://hms-api.test'
export const CASE_ID = '00000000-0000-4000-8000-000000000010'
export const INTAKE_ID = '00000000-0000-4000-8000-000000000020'
export const COLLABORATOR_ID = '00000000-0000-4000-8000-000000000040'
export const MANAGER_ID = '00000000-0000-4000-8000-000000000050'
export const LEGAL_AREA_ID = '00000000-0000-4000-8000-000000000061'
export const LEGAL_TOPIC_ID = '00000000-0000-4000-8000-000000000062'

export type CaseActor = {
  collaboratorId: string
  professionalName: string
  email: string
  profile: 'admin' | 'lawyer' | 'paralegal' | 'supervisor' | 'attendant'
  status: 'active' | 'disabled'
}

export const LAWYER: CaseActor = {
  collaboratorId: COLLABORATOR_ID,
  professionalName: 'Dra. Ana Advogada',
  email: 'ana@example.test',
  profile: 'lawyer',
  status: 'active',
}
export const ADMIN: CaseActor = {
  collaboratorId: '00000000-0000-4000-8000-000000000070',
  professionalName: 'Admin HMS',
  email: 'admin@example.test',
  profile: 'admin',
  status: 'active',
}
export const PARLEGAL: CaseActor = {
  collaboratorId: '00000000-0000-4000-8000-000000000080',
  professionalName: 'Paralegal HMS',
  email: 'paralegal@example.test',
  profile: 'paralegal',
  status: 'active',
}
export const CANDIDATE = {
  collaboratorId: '00000000-0000-4000-8000-000000000090',
  professionalName: 'Dra. Carla Candidata',
  email: 'carla@example.test',
  profile: 'lawyer',
  status: 'active',
}
export const ALTERNATE_CANDIDATE = {
  collaboratorId: '00000000-0000-4000-8000-000000000091',
  professionalName: 'Dra. Diana Paralegal',
  email: 'diana@example.test',
  profile: 'paralegal',
  status: 'active',
}
export const SUGGESTED_MANAGER = {
  ...CANDIDATE,
  collaboratorId: MANAGER_ID,
  professionalName: 'Dr. Eduardo da triagem',
}

type Options = { actor?: typeof LAWYER; openingManager?: typeof SUGGESTED_MANAGER }
export const test = authFixtureTest.extend<{
  caseManagementFixture: {
    mockRoutes: (
      options?: Options,
    ) => Promise<{ requests: { method: string; pathname: string; body: unknown }[] }>
  }
}>({
  caseManagementFixture: async ({ page }, use) => {
    await use({ mockRoutes: (options) => mockCaseOpeningRoutes(page, options) })
  },
})
async function mockCaseOpeningRoutes(page: Page, options: Options = {}) {
  const requests: { method: string; pathname: string; body: unknown }[] = []
  const actor = options.actor ?? LAWYER
  const summary = {
    id: CASE_ID,
    publicCode: 'CASO-20261001-0001',
    title: 'Caso de teste',
    clientName: 'Cliente Teste',
    legalArea: 'Previdenciário',
    legalTopic: 'Aposentadoria',
    status: 'documentation',
    updatedAt: '2026-10-01T12:00:00.000Z',
    checklistGate: { decision: 'pending' },
    dossierGate: { decision: 'pending' },
    team: [],
  }
  await page.route(`${BACKEND_URL}/**`, async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const { pathname } = url
    const body = request.postData() ? request.postDataJSON() : undefined
    requests.push({ method: request.method(), pathname, body })
    let response: unknown
    let status = 200
    if (pathname === '/collaborators/me') response = actor
    else if (pathname === '/communications/summary')
      response = { unreadCount: 0, items: [] }
    else if (pathname.endsWith('/professional-profile'))
      response = {
        ...(pathname.includes(ALTERNATE_CANDIDATE.collaboratorId)
          ? ALTERNATE_CANDIDATE
          : CANDIDATE),
        legalExpertises: [
          { legalArea: { id: LEGAL_AREA_ID, name: 'Previdenciário' }, legalTopics: [] },
        ],
      }
    else if (pathname === '/cases/team-candidates') {
      const profile = url.searchParams.get('profile')
      const candidates = [CANDIDATE, ALTERNATE_CANDIDATE].filter(
        (candidate) => !profile || candidate.profile === profile,
      )
      response = {
        items: candidates,
        page: 1,
        pageSize: 20,
        total: candidates.length,
        totalPages: 1,
      }
    } else if (pathname === `/cases/opening-sources/${INTAKE_ID}`)
      response = {
        intakeId: INTAKE_ID,
        suggestedManager: options.openingManager ?? SUGGESTED_MANAGER,
      }
    else if (pathname === '/cases' && request.method() === 'POST') {
      response = summary
      status = 201
    } else if (pathname === '/cases/my') response = [summary]
    else if (pathname === '/intakes')
      response = {
        items: [
          {
            intakeId: INTAKE_ID,
            displayId: 'TRI-0020',
            status: 'contracted',
            client: { name: 'Cliente Teste', taxId: '000.000.000-00' },
          },
        ],
        page: 1,
        pageSize: 10,
        total: 1,
        totalPages: 1,
      }
    else if (pathname === `/intakes/${INTAKE_ID}`)
      response = {
        intakeId: INTAKE_ID,
        legalAreaId: LEGAL_AREA_ID,
        legalTopicId: LEGAL_TOPIC_ID,
      }
    else if (pathname === '/legal-catalog/areas')
      response = [{ id: LEGAL_AREA_ID, name: 'Previdenciário' }]
    else if (pathname === `/legal-catalog/areas/${LEGAL_AREA_ID}/topics`)
      response = [{ id: LEGAL_TOPIC_ID, name: 'Aposentadoria por idade' }]
    else {
      response = { message: 'No fixture response' }
      status = 404
    }
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    })
  })
  return { requests }
}
