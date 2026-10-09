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

describe('requireProfessionalProfileReaderMiddleware', () => {
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
    const { requireProfessionalProfileReaderMiddleware } = await import(
      '../require-professional-profile-reader-middleware'
    )

    await expect(requireProfessionalProfileReaderMiddleware()).resolves.toEqual({
      userId: 'user-1',
      currentCollaborator: collaborator,
    })
  })

  it.each([
    { isFailure: true, statusCode: 0 },
    { isFailure: true, statusCode: 503 },
    { isFailure: true, statusCode: 403 },
  ])('handles profile lookup failure: %o', async (response) => {
    mocks.getCurrentCollaborator.mockResolvedValue(response)
    const { requireProfessionalProfileReaderMiddleware } = await import(
      '../require-professional-profile-reader-middleware'
    )

    const result = requireProfessionalProfileReaderMiddleware()
    if (response.statusCode === 0 || response.statusCode >= 500) {
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
    { profile: CollaboratorProfile.Client, status: UserStatus.Active },
    { profile: CollaboratorProfile.Lawyer, status: UserStatus.Disabled },
  ])('redirects an inactive or unapproved collaborator: %o', async (collaborator) => {
    mocks.getCurrentCollaborator.mockResolvedValue({
      isFailure: false,
      body: { collaboratorId: 'collab-1', ...collaborator },
    })
    const { requireProfessionalProfileReaderMiddleware } = await import(
      '../require-professional-profile-reader-middleware'
    )

    await expect(requireProfessionalProfileReaderMiddleware()).rejects.toMatchObject({
      redirect: { to: expect.any(String) },
    })
  })
})
