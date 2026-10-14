import { expect, type Page } from '@playwright/test'
import { test as authFixtureTest } from './auth-fixture'

export const BACKEND_URL = 'http://hms-api.test'
export const CASE_ID = '00000000-0000-4000-8000-000000000010'
export const INTAKE_ID = '00000000-0000-4000-8000-000000000020'
export const ITEM_ID = '00000000-0000-4000-8000-000000000030'
export const COLLABORATOR_ID = '00000000-0000-4000-8000-000000000040'
export const MANAGER_ID = '00000000-0000-4000-8000-000000000050'
export const DOCUMENT_ID = '00000000-0000-4000-8000-000000000060'
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

export const TEAM_MEMBER = {
  membershipId: 'membership-1',
  collaboratorId: COLLABORATOR_ID,
  professionalName: 'Dr. Bruno Gestor',
  email: 'bruno@example.test',
  profile: 'lawyer',
  role: 'manager',
  assignedAt: '2026-10-01T12:00:00.000Z',
  isEligible: true,
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
  ...TEAM_MEMBER,
  collaboratorId: MANAGER_ID,
  professionalName: 'Dr. Eduardo da triagem',
  email: 'eduardo@example.test',
}

export type CapturedCaseRequest = {
  method: string
  pathname: string
  search: string
  body: unknown
}
export type CapturedCaseResponse = { pathname: string; status: number }

type FixtureOptions = {
  actor?: CaseActor
  caseStatus?: string
  canManageTeam?: boolean
  requiresAdministrativeReason?: boolean
  members?: (typeof TEAM_MEMBER)[]
  openingManager?: typeof CANDIDATE | typeof SUGGESTED_MANAGER | undefined
  createStatus?: number
  caseTeamStatus?: number
  myCasesStatus?: number
  adminCasesStatus?: number
  adminCasesEmpty?: boolean
  checklistStatus?: number
}

export type CaseManagementFixture = {
  mockRoutes: (options?: FixtureOptions) => Promise<{
    requests: CapturedCaseRequest[]
    responses: CapturedCaseResponse[]
    browserErrors: string[]
    getTeamRequestCount: () => number
  }>
}

export const test = authFixtureTest.extend<{
  caseManagementFixture: CaseManagementFixture
}>({
  caseManagementFixture: async ({ page }, use) => {
    await use({ mockRoutes: (options) => mockCaseManagementRoutes(page, options) })
  },
})

export async function mockCaseManagementRoutes(page: Page, options: FixtureOptions = {}) {
  const actor = options.actor ?? LAWYER
  const members = [...(options.members ?? [TEAM_MEMBER])]
  const requests: CapturedCaseRequest[] = []
  const responses: CapturedCaseResponse[] = []
  const browserErrors: string[] = []
  let teamRequestCount = 0
  page.on('pageerror', (error) => browserErrors.push(error.message))
  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      !message.text().startsWith('Failed to load resource:')
    ) {
      browserErrors.push(message.text())
    }
  })
  page.on('response', (response) => {
    const url = new URL(response.url())
    if (url.origin === BACKEND_URL) {
      responses.push({ pathname: url.pathname, status: response.status() })
    }
  })
  const json = (data: unknown) => ({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(data),
  })
  const caseTeam = {
    caseId: CASE_ID,
    publicCode: 'CASO-20261001-0001',
    status: options.caseStatus ?? 'documentation',
    teamVersion: 3,
    members,
    total: members.length,
    activeManagerCount: members.filter((member) => member.role === 'manager').length,
    canManageTeam:
      options.canManageTeam ??
      (actor.profile === 'admin' ||
        members.some((member) => member.collaboratorId === actor.collaboratorId)),
    canManage:
      options.canManageTeam ??
      (actor.profile === 'admin' ||
        members.some((member) => member.collaboratorId === actor.collaboratorId)),
    requiresAdministrativeReason:
      options.requiresAdministrativeReason ?? actor.profile === 'admin',
  }
  const caseSummary = {
    id: CASE_ID,
    intakeId: INTAKE_ID,
    publicCode: caseTeam.publicCode,
    title: 'Ação previdenciária de teste',
    status: caseTeam.status,
    teamVersion: caseTeam.teamVersion,
    clientName: 'Cliente Restrito Teste',
    legalArea: 'Previdenciário',
    legalTopic: 'Aposentadoria por idade',
    openedAt: '2026-10-01T12:00:00.000Z',
    updatedAt: '2026-10-02T12:00:00.000Z',
    checklistGate: { decision: 'pending', decidedAt: null, reason: null },
    dossierGate: { decision: 'pending', decidedAt: null, reason: null },
    team: members.map((member) => ({
      collaboratorId: member.collaboratorId,
      name: member.professionalName,
      role: member.role,
    })),
  }
  await page.route(`${BACKEND_URL}/**`, async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const { pathname } = url
    const body = request.postData() ? request.postDataJSON() : undefined
    requests.push({ method: request.method(), pathname, search: url.search, body })

    if (pathname === '/collaborators/me' && request.method() === 'GET') {
      await route.fulfill(json(actor))
      return
    }
    if (pathname === '/communications/summary') {
      await route.fulfill(json({ unreadCount: 0, items: [] }))
      return
    }
    if (
      pathname.startsWith('/collaborators/') &&
      pathname.endsWith('/professional-profile')
    ) {
      const profileId = pathname.split('/').at(-2) ?? CANDIDATE.collaboratorId
      const member = members.find((item) => item.collaboratorId === profileId)
      const profileSource = member ?? CANDIDATE
      await route.fulfill(
        json({
          collaboratorId: profileId,
          professionalName: profileSource.professionalName,
          email: profileSource.email,
          profile: profileSource.profile,
          legalExpertises: [
            { legalArea: { id: LEGAL_AREA_ID, name: 'Previdenciário' }, legalTopics: [] },
          ],
        }),
      )
      return
    }
    if (pathname === `/cases/${CASE_ID}/team` && request.method() === 'GET') {
      teamRequestCount += 1
      if (options.caseTeamStatus && options.caseTeamStatus !== 200) {
        await route.fulfill({
          status: options.caseTeamStatus,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Acesso ao caso recusado' }),
        })
        return
      }
      await route.fulfill(json(caseTeam))
      return
    }
    if (pathname === `/cases/${CASE_ID}/tasks` && request.method() === 'GET') {
      await route.fulfill(json([]))
      return
    }
    if (pathname === `/cases/${CASE_ID}/team/history`) {
      await route.fulfill(
        json({
          items: [],
          page: 1,
          pageSize: 20,
          total: 0,
          totalPages: 0,
        }),
      )
      return
    }
    if (pathname === '/cases/team-candidates') {
      const profileFilter = url.searchParams.get('profile')
      const search = url.searchParams.get('search')?.toLowerCase()
      const candidateItems = [CANDIDATE, ALTERNATE_CANDIDATE].filter(
        (candidate) =>
          (!profileFilter || candidate.profile === profileFilter) &&
          (!search || candidate.professionalName.toLowerCase().includes(search)),
      )
      await route.fulfill(
        json({
          items: candidateItems,
          page: Number(url.searchParams.get('page') ?? 1),
          pageSize: 20,
          total: candidateItems.length,
          totalPages: candidateItems.length ? 1 : 0,
        }),
      )
      return
    }
    if (pathname === `/cases/${CASE_ID}/team` && request.method() === 'POST') {
      const payload = body as { collaboratorId: string; role: string }
      const candidate = [CANDIDATE, ALTERNATE_CANDIDATE].find(
        (item) => item.collaboratorId === payload.collaboratorId,
      )
      if (candidate) {
        members.push({
          ...candidate,
          role: payload.role,
          membershipId: 'new-membership',
          assignedAt: '2026-10-01T12:00:00.000Z',
          isEligible: true,
        })
        caseTeam.total = members.length
        caseTeam.teamVersion += 1
      }

      await route.fulfill(
        json({
          caseId: CASE_ID,
          membershipId: 'new-membership',
          teamVersion: 4,
          historyId: 'history-1',
        }),
      )
      return
    }
    if (pathname === `/cases/${CASE_ID}/team/membership-1/role`) {
      await route.fulfill(
        json({
          caseId: CASE_ID,
          membershipId: 'membership-1',
          teamVersion: 4,
          historyId: 'history-1',
        }),
      )
      return
    }
    if (
      pathname === `/cases/${CASE_ID}/team/membership-1` &&
      request.method() === 'DELETE'
    ) {
      await route.fulfill(
        json({
          caseId: CASE_ID,
          membershipId: 'membership-1',
          teamVersion: 4,
          historyId: 'history-1',
        }),
      )
      return
    }
    if (pathname === '/cases/my') {
      if (options.myCasesStatus && options.myCasesStatus !== 200) {
        await route.fulfill({
          status: options.myCasesStatus,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Forbidden' }),
        })
        return
      }
      await route.fulfill(json([caseSummary]))
      return
    }
    if (pathname === `/cases/${CASE_ID}` && request.method() === 'GET') {
      await route.fulfill(json(caseSummary))
      return
    }
    if (pathname === `/cases/${CASE_ID}/tasks` && request.method() === 'GET') {
      await route.fulfill(json([]))
      return
    }
    if (pathname === `/cases/${CASE_ID}/checklist` && request.method() === 'GET') {
      if (options.checklistStatus && options.checklistStatus !== 200) {
        await route.fulfill({
          status: options.checklistStatus,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Forbidden' }),
        })
        return
      }
      await route.fulfill(
        json([
          {
            id: ITEM_ID,
            caseId: CASE_ID,
            templateItemKey: 'identity-document',
            checklistTemplateName: 'Documentos pessoais',
            title: 'Documento de identidade',
            status: 'pending',
            isRequired: true,
            documentFileId: DOCUMENT_ID,
            createdAt: '2026-10-01T12:00:00.000Z',
            updatedAt: '2026-10-02T12:00:00.000Z',
          },
        ]),
      )
      return
    }
    if (pathname === `/cases/${CASE_ID}/pendencies`) {
      await route.fulfill(json([]))
      return
    }
    if (pathname === `/cases/${CASE_ID}/portal-access`) {
      await route.fulfill(json([]))
      return
    }
    if (pathname === '/third-parties') {
      await route.fulfill(json([]))
      return
    }
    if (pathname === '/document-validation/documents') {
      await route.fulfill(json([]))
      return
    }

    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ message: `No mock for ${request.method()} ${pathname}` }),
    })
  })

  return {
    requests,
    responses,
    browserErrors,
    getTeamRequestCount: () => teamRequestCount,
  }
}

export async function expectNoProtectedCaseRequests(requests: CapturedCaseRequest[]) {
  expect(
    requests.some((request) =>
      /\/cases\/[^/]+\/(checklist|pendencies|portal-access)/.test(request.pathname),
    ),
  ).toBe(false)
}
