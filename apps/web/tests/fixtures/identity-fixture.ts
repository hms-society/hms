import { expect, type Page } from '@playwright/test'

import { test as authFixtureTest } from './auth-fixture'

export const BACKEND_URL = 'http://hms-api.test'
export const COLLABORATOR_ID = 'collaborator-id'

type FixtureCollaborator = {
  collaboratorId: string
  professionalName: string
  email: string
  profile:
    | 'admin'
    | 'attendant'
    | 'client'
    | 'lawyer'
    | 'paralegal'
    | 'supervisor'
    | 'intern'
  status: 'active' | 'invited' | 'disabled'
  jobTitle?: string
  lastAccessAt?: string
  legalExpertises?: readonly unknown[]
}

type ActionKind = 'resend' | 'cancel-invitation' | 'deactivate' | 'reactivate' | 'remove'

type RecordedRequest = {
  method: string
  pathname: string
  body: unknown
}

type RouteMockState = {
  collaborators: FixtureCollaborator[]
  listError?: string
  listDelayMs: number
  actionErrors: Partial<Record<ActionKind, string>>
  actionDelays: Partial<Record<ActionKind, number>>
  requests: RecordedRequest[]
}

type CollaboratorRouteOptions = {
  currentCollaborator?: FixtureCollaborator
  collaborators?: FixtureCollaborator[]
  listError?: string
  listDelayMs?: number
  actionErrors?: Partial<Record<ActionKind, string>>
  actionDelays?: Partial<Record<ActionKind, number>>
}

type FixtureIdentity = {
  identityFixture: {
    mockCollaboratorRoutes: (
      options?: CollaboratorRouteOptions,
    ) => Promise<RouteMockState>
  }
}

export const ADMINISTRATOR: FixtureCollaborator = {
  collaboratorId: 'administrator-id',
  professionalName: 'Administrador HMS',
  email: 'admin@hms.test',
  profile: 'admin',
  status: 'active',
  jobTitle: 'Administrador',
  lastAccessAt: '2026-07-30T12:00:00.000Z',
}

export const ATTENDANT: FixtureCollaborator = {
  collaboratorId: 'attendant-id',
  professionalName: 'Atendente HMS',
  email: 'attendant@hms.test',
  profile: 'attendant',
  status: 'active',
  jobTitle: 'Atendimento',
  lastAccessAt: '2026-07-30T12:00:00.000Z',
}

export const ACTIVE_COLLABORATOR: FixtureCollaborator = {
  collaboratorId: COLLABORATOR_ID,
  professionalName: 'Maria Oliveira',
  email: 'maria@example.com',
  profile: 'lawyer',
  status: 'active',
  jobTitle: 'Advogada',
  lastAccessAt: '2026-07-29T15:30:00.000Z',
  legalExpertises: [],
}

export const INVITED_COLLABORATOR: FixtureCollaborator = {
  collaboratorId: 'invited-collaborator-id',
  professionalName: 'João Mendes',
  email: 'joao@example.com',
  profile: 'attendant',
  status: 'invited',
  jobTitle: 'Atendente',
  lastAccessAt: undefined,
}

export const DISABLED_COLLABORATOR: FixtureCollaborator = {
  collaboratorId: 'disabled-collaborator-id',
  professionalName: 'Carlos Lima',
  email: 'carlos@example.com',
  profile: 'lawyer',
  status: 'disabled',
  jobTitle: 'Advogado',
  lastAccessAt: '2026-07-28T15:30:00.000Z',
  legalExpertises: [],
}

export const CANCELLED_COLLABORATOR: FixtureCollaborator = {
  collaboratorId: 'cancelled-collaborator-id',
  professionalName: 'Ana Souza',
  email: 'ana@example.com',
  profile: 'attendant',
  status: 'disabled',
  jobTitle: 'Atendente',
  lastAccessAt: undefined,
}

const LEGAL_AREA = { id: 'labor-id', name: 'Trabalhista', active: true }
const LEGAL_TOPIC = { id: 'contracts-id', name: 'Contratos', active: true }

function cloneCollaborator(collaborator: FixtureCollaborator) {
  return {
    ...collaborator,
    legalExpertises: [...(collaborator.legalExpertises ?? [])],
  }
}

function getActionFromPath(
  pathname: string,
): { kind: ActionKind; collaboratorId: string; method: string } | undefined {
  const match = pathname.match(
    /^\/collaborators\/([^/]+)\/(invitation\/resend|invitation\/cancel|deactivate|reactivate)$/,
  )
  if (!match) return undefined

  const actionByPath: Record<string, { kind: ActionKind; method: string }> = {
    'invitation/resend': { kind: 'resend', method: 'POST' },
    'invitation/cancel': { kind: 'cancel-invitation', method: 'POST' },
    deactivate: { kind: 'deactivate', method: 'POST' },
    reactivate: { kind: 'reactivate', method: 'POST' },
  }
  const action = actionByPath[match[2]]

  return action ? { ...action, collaboratorId: match[1] } : undefined
}

export async function mockCollaboratorRoutes(
  page: Page,
  options: CollaboratorRouteOptions = {},
) {
  const state: RouteMockState = {
    collaborators: (options.collaborators ?? [ACTIVE_COLLABORATOR]).map(
      cloneCollaborator,
    ),
    listError: options.listError,
    listDelayMs: options.listDelayMs ?? 0,
    actionErrors: options.actionErrors ?? {},
    actionDelays: options.actionDelays ?? {},
    requests: [],
  }

  await page.route(`${BACKEND_URL}/**`, async (route) => {
    const request = route.request()
    const requestUrl = new URL(request.url())
    const { pathname } = requestUrl

    if (pathname === '/collaborators/me' && request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(options.currentCollaborator ?? ADMINISTRATOR),
      })
      return
    }

    if (pathname === '/collaborators/job-titles' && request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(['Advogada', 'Atendente', 'Administrador']),
      })
      return
    }

    if (pathname === '/legal-catalog/areas' && request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([LEGAL_AREA]),
      })
      return
    }

    if (
      pathname === '/legal-catalog/areas/labor-id/topics' &&
      request.method() === 'GET'
    ) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([LEGAL_TOPIC]),
      })
      return
    }

    const action = getActionFromPath(pathname)
    if (action) {
      const body = request.postData() ? request.postDataJSON() : undefined
      state.requests.push({ method: request.method(), pathname, body })

      const delay = state.actionDelays[action.kind]
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay))

      const errorMessage = state.actionErrors[action.kind]
      if (errorMessage) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: errorMessage }),
        })
        return
      }

      const collaborator = state.collaborators.find(
        (item) => item.collaboratorId === action.collaboratorId,
      )
      if (!collaborator) {
        await route.fulfill({
          status: 404,
          body: JSON.stringify({ message: 'Not found' }),
        })
        return
      }

      if (action.kind === 'cancel-invitation') {
        collaborator.status = 'disabled'
        collaborator.lastAccessAt = undefined
      }
      if (action.kind === 'deactivate') collaborator.status = 'disabled'
      if (action.kind === 'reactivate') collaborator.status = 'active'

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(collaborator),
      })
      return
    }

    if (
      pathname === `/collaborators/${COLLABORATOR_ID}` &&
      request.method() === 'PATCH'
    ) {
      const body = request.postDataJSON() as Partial<FixtureCollaborator>
      const collaborator = state.collaborators.find(
        (item) => item.collaboratorId === COLLABORATOR_ID,
      )
      if (!collaborator) {
        await route.fulfill({
          status: 404,
          body: JSON.stringify({ message: 'Not found' }),
        })
        return
      }

      Object.assign(collaborator, body)
      state.requests.push({ method: request.method(), pathname, body })
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(collaborator),
      })
      return
    }

    if (pathname === `/collaborators/${COLLABORATOR_ID}` && request.method() === 'GET') {
      const collaborator = state.collaborators.find(
        (item) => item.collaboratorId === COLLABORATOR_ID,
      )
      await route.fulfill({
        status: collaborator ? 200 : 404,
        contentType: 'application/json',
        body: JSON.stringify(
          collaborator
            ? {
                ...collaborator,
                legalExpertises: [
                  {
                    legalArea: { id: 'labor-id', name: 'Trabalhista', active: true },
                    legalTopics: [
                      { id: 'contracts-id', name: 'Contratos', active: true },
                    ],
                  },
                ],
              }
            : { message: 'Not found' },
        ),
      })
      return
    }

    if (pathname === `/collaborators/${CANCELLED_COLLABORATOR.collaboratorId}`) {
      await route.fulfill({ status: 404, body: JSON.stringify({ message: 'Not found' }) })
      return
    }

    if (pathname === '/collaborators' && request.method() === 'GET') {
      if (state.listDelayMs) {
        await new Promise((resolve) => setTimeout(resolve, state.listDelayMs))
      }
      if (state.listError) {
        const errorMessage = state.listError
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: errorMessage }),
        })
        return
      }

      const search = requestUrl.searchParams.get('search')?.toLowerCase()
      const status = requestUrl.searchParams.get('status')
      const filtered = state.collaborators.filter((collaborator) => {
        const matchesSearch =
          !search ||
          collaborator.professionalName.toLowerCase().includes(search) ||
          collaborator.email.toLowerCase().includes(search)
        const matchesStatus = !status || collaborator.status === status
        return matchesSearch && matchesStatus
      })
      const pageNumber = Number(requestUrl.searchParams.get('page') ?? 1)
      const pageSize = Number(requestUrl.searchParams.get('pageSize') ?? 20)
      const start = (pageNumber - 1) * pageSize

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: filtered.slice(start, start + pageSize),
          page: pageNumber,
          pageSize,
          total: filtered.length,
          totalPages: Math.ceil(filtered.length / pageSize),
        }),
      })
      return
    }

    if (pathname === `/collaborators/${CANCELLED_COLLABORATOR.collaboratorId}`) {
      await route.fulfill({ status: 404, body: JSON.stringify({ message: 'Not found' }) })
      return
    }

    if (pathname.startsWith('/collaborators/') && request.method() === 'DELETE') {
      const collaboratorId = pathname.split('/').at(-1)
      const index = state.collaborators.findIndex(
        (item) => item.collaboratorId === collaboratorId,
      )
      state.requests.push({ method: request.method(), pathname, body: undefined })
      if (index < 0) {
        await route.fulfill({
          status: 404,
          body: JSON.stringify({ message: 'Not found' }),
        })
        return
      }

      state.collaborators.splice(index, 1)
      await route.fulfill({ status: 204 })
      return
    }

    await route.fulfill({ status: 404, body: JSON.stringify({ message: 'Not found' }) })
  })

  return state
}

export async function openCollaboratorActions(page: Page, professionalName: string) {
  await page.getByRole('button', { name: `Ações de ${professionalName}` }).click()
  await expect(page.getByRole('menu')).toBeVisible()
}

export async function confirmAction(page: Page, menuLabel: string, buttonLabel: string) {
  await page.getByRole('menuitem', { name: menuLabel }).click()
  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: buttonLabel })).toBeVisible()
  await dialog.getByRole('button', { name: buttonLabel }).click()
}

export const test = authFixtureTest.extend<FixtureIdentity>({
  identityFixture: async ({ page }, use) => {
    await use({
      mockCollaboratorRoutes: (options) => mockCollaboratorRoutes(page, options),
    })
  },
})
