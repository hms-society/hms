import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CollaboratorProfile, UserStatus } from '@hms/core/identity/domain/structures'
import { LegalCaseStatus } from '@hms/core/case-management/domain/structures'

const mocks = vi.hoisted(() => ({
  getCurrentCollaborator: vi.fn(),
  getCaseTeam: vi.fn(),
  getSession: vi.fn().mockResolvedValue({ accessToken: 'session-token' }),
  requireAuthMiddleware: vi.fn(),
  redirect: vi.fn((options: unknown) => ({ redirect: options })),
}))

vi.mock('@tanstack/react-router', () => ({ redirect: mocks.redirect }))
vi.mock('@/rest/axios/axios-rest-client', () => ({
  AxiosRestClient: (_baseUrl: string, getSession: () => Promise<unknown>) => ({
    getSession,
  }),
}))
vi.mock('@/provision/auth/supabase/supabase-auth-provider', () => ({
  SupabaseAuthProvider: () => ({ getSession: mocks.getSession }),
}))
vi.mock('@/rest/services/identity-service', () => ({
  IdentityService: (client: { getSession: () => Promise<unknown> }) => ({
    getCurrentCollaborator: async () => {
      await client.getSession()
      return mocks.getCurrentCollaborator()
    },
  }),
}))
vi.mock('@/rest/services/case-management-service', () => ({
  CaseManagementService: (client: { getSession: () => Promise<unknown> }) => ({
    getCaseTeam: async (...args: unknown[]) => {
      await client.getSession()
      return mocks.getCaseTeam(...args)
    },
  }),
}))
vi.mock('../require-auth-middleware', () => ({
  requireAuthMiddleware: mocks.requireAuthMiddleware,
}))

describe('requireCaseReaderMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireAuthMiddleware.mockResolvedValue({ userId: 'user-1' })
    mocks.getCaseTeam.mockResolvedValue({ isFailure: false, body: caseTeam })
  })

  it('allows Admin read access to a case without membership', async () => {
    const collaborator = makeCollaborator(CollaboratorProfile.Admin)
    mocks.getCurrentCollaborator.mockResolvedValue({
      isFailure: false,
      body: collaborator,
    })
    const { requireCaseReaderMiddleware } = await import(
      '../require-case-reader-middleware'
    )

    await expect(
      requireCaseReaderMiddleware({ params: { caseId: 'case-1' } }),
    ).resolves.toEqual({
      userId: 'user-1',
      caseTeam,
      currentCollaborator: collaborator,
    })
  })

  it('allows a legal collaborator to read only an eligible team case', async () => {
    const collaborator = makeCollaborator(CollaboratorProfile.Lawyer)
    mocks.getCurrentCollaborator.mockResolvedValue({
      isFailure: false,
      body: collaborator,
    })
    mocks.getCaseTeam.mockResolvedValue({
      isFailure: false,
      body: {
        ...caseTeam,
        members: [{ collaboratorId: collaborator.collaboratorId, isEligible: true }],
      },
    })
    const { requireCaseReaderMiddleware } = await import(
      '../require-case-reader-middleware'
    )

    await expect(
      requireCaseReaderMiddleware({ params: { caseId: 'case-1' } }),
    ).resolves.toMatchObject({ currentCollaborator: collaborator })
  })

  it('allows a legal collaborator to enter the case creator route without a case id', async () => {
    const collaborator = makeCollaborator(CollaboratorProfile.Lawyer)
    mocks.getCurrentCollaborator.mockResolvedValue({
      isFailure: false,
      body: collaborator,
    })
    const { requireCaseReaderMiddleware } = await import(
      '../require-case-reader-middleware'
    )

    await expect(requireCaseReaderMiddleware({ params: {} })).resolves.toMatchObject({
      currentCollaborator: collaborator,
    })
    expect(mocks.getCaseTeam).not.toHaveBeenCalled()
  })

  it.each([
    { profile: CollaboratorProfile.Admin, legalContentOnly: true },
    { profile: CollaboratorProfile.Client, legalContentOnly: false },
    {
      profile: CollaboratorProfile.Lawyer,
      legalContentOnly: false,
      status: UserStatus.Disabled,
    },
  ])('redirects a caller without the required profile or status: %o', async (input) => {
    mocks.getCurrentCollaborator.mockResolvedValue({
      isFailure: false,
      body: makeCollaborator(input.profile, input.status),
    })
    const { requireCaseReaderMiddleware } = await import(
      '../require-case-reader-middleware'
    )

    await expect(
      requireCaseReaderMiddleware({
        params: { caseId: 'case-1' },
        legalContentOnly: input.legalContentOnly,
      }),
    ).rejects.toMatchObject({ redirect: { to: expect.any(String) } })
  })

  it('redirects an Admin without a case id from a route that requires legal access', async () => {
    mocks.getCurrentCollaborator.mockResolvedValue({
      isFailure: false,
      body: makeCollaborator(CollaboratorProfile.Admin),
    })
    const { requireCaseReaderMiddleware } = await import(
      '../require-case-reader-middleware'
    )

    await expect(requireCaseReaderMiddleware({ params: {} })).rejects.toMatchObject({
      redirect: { to: expect.any(String) },
    })
  })

  it.each([
    { isFailure: true, statusCode: 0 },
    { isFailure: true, statusCode: 500 },
    { isFailure: true, statusCode: 403 },
  ])('handles collaborator lookup failures: %o', async (response) => {
    mocks.getCurrentCollaborator.mockResolvedValue(response)
    const { requireCaseReaderMiddleware } = await import(
      '../require-case-reader-middleware'
    )

    const result = requireCaseReaderMiddleware({ params: { caseId: 'case-1' } })
    if (response.statusCode >= 500) {
      await expect(result).rejects.toMatchObject({
        message: 'Não foi possível verificar seu perfil.',
      })
    } else {
      await expect(result).rejects.toMatchObject({
        redirect: { to: expect.any(String) },
      })
    }
  })

  it.each([
    { isFailure: true, statusCode: 0 },
    { isFailure: true, statusCode: 503 },
    { isFailure: true, statusCode: 404 },
  ])('handles case team lookup failures: %o', async (response) => {
    mocks.getCurrentCollaborator.mockResolvedValue({
      isFailure: false,
      body: makeCollaborator(CollaboratorProfile.Admin),
    })
    mocks.getCaseTeam.mockResolvedValue(response)
    const { requireCaseReaderMiddleware } = await import(
      '../require-case-reader-middleware'
    )

    const result = requireCaseReaderMiddleware({ params: { caseId: 'case-1' } })
    if (response.statusCode === 0 || response.statusCode >= 500) {
      await expect(result).rejects.toMatchObject({
        message: 'Não foi possível verificar o acesso a este caso.',
      })
    } else {
      await expect(result).rejects.toMatchObject({
        redirect: { to: expect.any(String) },
      })
    }
  })

  it('redirects a legal collaborator without an eligible case team membership', async () => {
    const collaborator = makeCollaborator(CollaboratorProfile.Paralegal)
    mocks.getCurrentCollaborator.mockResolvedValue({
      isFailure: false,
      body: collaborator,
    })
    mocks.getCaseTeam.mockResolvedValue({
      isFailure: false,
      body: {
        ...caseTeam,
        members: [{ collaboratorId: collaborator.collaboratorId, isEligible: false }],
      },
    })
    const { requireCaseReaderMiddleware } = await import(
      '../require-case-reader-middleware'
    )

    await expect(
      requireCaseReaderMiddleware({ params: { caseId: 'case-1' } }),
    ).rejects.toMatchObject({ redirect: { to: expect.any(String) } })
  })
})

const caseTeam = {
  id: 'case-1',
  status: LegalCaseStatus.Documentation,
  canManage: true,
  members: [],
}

function makeCollaborator(
  profile: CollaboratorProfile,
  status: UserStatus = UserStatus.Active,
) {
  return { collaboratorId: 'collab-1', profile, status }
}
