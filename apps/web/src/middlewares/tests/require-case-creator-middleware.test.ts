import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CollaboratorProfile, UserStatus } from '@hms/core/identity/domain/structures'

const mocks = vi.hoisted(() => ({
  getCurrentCollaborator: vi.fn(),
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
vi.mock('../require-auth-middleware', () => ({
  requireAuthMiddleware: mocks.requireAuthMiddleware,
}))

describe('requireCaseCreatorMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireAuthMiddleware.mockResolvedValue({ userId: 'user-1' })
  })

  it.each([
    CollaboratorProfile.Admin,
    CollaboratorProfile.Lawyer,
  ])('allows an active %s', async (profile) => {
    const collaborator = {
      collaboratorId: 'collab-1',
      profile,
      status: UserStatus.Active,
    }
    mocks.getCurrentCollaborator.mockResolvedValue({
      isFailure: false,
      body: collaborator,
    })

    const { requireCaseCreatorMiddleware } = await import(
      '../require-case-creator-middleware'
    )

    await expect(requireCaseCreatorMiddleware()).resolves.toEqual({
      userId: 'user-1',
      currentCollaborator: collaborator,
    })
    expect(mocks.requireAuthMiddleware).toHaveBeenCalledOnce()
  })

  it.each([
    0, 503,
  ])('raises an availability error for a profile lookup failure with status %s', async (statusCode) => {
    mocks.getCurrentCollaborator.mockResolvedValue({
      isFailure: true,
      statusCode,
    })
    const { requireCaseCreatorMiddleware } = await import(
      '../require-case-creator-middleware'
    )

    await expect(requireCaseCreatorMiddleware()).rejects.toMatchObject({
      message: 'Não foi possível verificar seu perfil.',
    })
  })

  it.each([
    { isFailure: true, statusCode: 403 },
    {
      isFailure: false,
      body: {
        collaboratorId: 'collab-1',
        profile: CollaboratorProfile.Lawyer,
        status: UserStatus.Disabled,
      },
    },
    {
      isFailure: false,
      body: {
        collaboratorId: 'collab-1',
        profile: CollaboratorProfile.Client,
        status: UserStatus.Active,
      },
    },
  ])('redirects ineligible profiles or collaborators: %o', async (response) => {
    mocks.getCurrentCollaborator.mockResolvedValue(response)
    const { requireCaseCreatorMiddleware } = await import(
      '../require-case-creator-middleware'
    )

    await expect(requireCaseCreatorMiddleware()).rejects.toMatchObject({
      redirect: { to: expect.any(String) },
    })
  })
})
