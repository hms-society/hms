import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ROUTES } from '@/constants/routes'

const mocks = vi.hoisted(() => ({ getSession: vi.fn() }))

vi.mock('@/provision/auth/supabase/supabase-auth-provider', () => ({
  SupabaseAuthProvider: () => ({ getSession: mocks.getSession }),
}))

import { redirectAuthenticatedMiddleware } from '../redirect-authenticated-middleware'

describe('redirectAuthenticatedMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows an authenticated collaborator to return to the Signing Gateway', async () => {
    mocks.getSession.mockResolvedValue({ accessToken: 'access-token' })

    await expect(
      redirectAuthenticatedMiddleware({ returnTo: ROUTES.signingGateway }),
    ).resolves.toBeUndefined()
  })

  it('redirects an authenticated user away from the regular login page', async () => {
    mocks.getSession.mockResolvedValue({ accessToken: 'access-token' })

    await expect(redirectAuthenticatedMiddleware()).rejects.toMatchObject({
      options: { to: ROUTES.home },
    })
  })
})
