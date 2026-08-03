import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

import { SupabaseAuthAdministrationProvider } from '@/identity/providers/supabase-auth-administration-provider'
import { SupabaseAuthProvider } from '@/identity/providers/supabase-auth-provider'
import { EnvProvider } from '@/shared/provision/env/env-provider'
import { AppError, ConflictError } from '@hms/core/shared/domain/errors'

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}))

const createUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    email: 'person@example.com',
    app_metadata: { provider: 'email' },
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-07-29T00:00:00.000Z',
    ...overrides,
  }) as User

describe('SupabaseAuthProvider', () => {
  const signInWithPassword = vi.fn()
  const getUser = vi.fn()
  const authClient = {
    auth: {
      signInWithPassword,
      getUser,
    },
  } as unknown as SupabaseClient

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockReturnValue(authClient)
  })

  it('maps a Supabase password session to the common auth contract', async () => {
    const accessToken = `header.${Buffer.from(JSON.stringify({ session_id: 'session-1' })).toString('base64url')}.signature`
    const user = createUser()
    signInWithPassword.mockResolvedValue({
      data: {
        session: {
          access_token: accessToken,
          refresh_token: 'refresh-token',
          expires_at: 1_800_000_000,
          user,
        },
      },
      error: null,
    })

    const provider = new SupabaseAuthProvider(createEnvProvider())

    await expect(
      provider.signIn({ identifier: user.email ?? '', password: 'password' }),
    ).resolves.toEqual({
      accessToken,
      refreshToken: 'refresh-token',
      expiresAt: 1_800_000_000,
      sessionId: 'session-1',
      user: { id: user.id, email: user.email },
    })
    expect(authClient.auth.admin).toBeUndefined()
  })

  it('verifies an access token through Supabase getUser', async () => {
    const user = createUser()
    getUser.mockResolvedValue({ data: { user }, error: null })
    const provider = new SupabaseAuthProvider(createEnvProvider())

    await expect(provider.getUser('access-token')).resolves.toEqual({
      id: user.id,
      email: user.email,
    })
    expect(getUser).toHaveBeenCalledWith('access-token')
  })
})

describe('SupabaseAuthAdministrationProvider', () => {
  const adminCreateUser = vi.fn()
  const adminDeleteUser = vi.fn()
  const inviteUserByEmail = vi.fn()
  const listUsers = vi.fn()
  const getUserById = vi.fn()
  const updateUserById = vi.fn()
  const signOut = vi.fn()
  const authClient = {
    auth: {
      admin: {
        createUser: adminCreateUser,
        deleteUser: adminDeleteUser,
        inviteUserByEmail,
        listUsers,
        getUserById,
        updateUserById,
        signOut,
      },
    },
  } as unknown as SupabaseClient

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockReturnValue(authClient)
  })

  it('creates a confirmed user with the supplied password', async () => {
    const user = createUser({ id: 'seeded-user', email: 'lawyer@hmsadvogados.com.br' })
    adminCreateUser.mockResolvedValue({ data: { user }, error: null })
    const provider = new SupabaseAuthAdministrationProvider(createEnvProvider())

    await expect(
      provider.createUser('lawyer@hmsadvogados.com.br', '123456'),
    ).resolves.toEqual({ id: 'seeded-user', email: 'lawyer@hmsadvogados.com.br' })
    expect(adminCreateUser).toHaveBeenCalledWith({
      email: 'lawyer@hmsadvogados.com.br',
      password: '123456',
      email_confirm: true,
    })
  })

  it('invites a user and preserves only the returned auth identity', async () => {
    const user = createUser({ id: 'invited-user' })
    inviteUserByEmail.mockResolvedValue({ data: { user }, error: null })
    const provider = new SupabaseAuthAdministrationProvider(createEnvProvider())

    await expect(
      provider.inviteUserByEmail('person@example.com', 'http://localhost:3000/convite'),
    ).resolves.toEqual({ id: 'invited-user', email: 'person@example.com' })
    expect(inviteUserByEmail).toHaveBeenCalledWith('person@example.com', {
      redirectTo: 'http://localhost:3000/convite',
    })
  })

  it('removes a user through the Auth admin API', async () => {
    adminDeleteUser.mockResolvedValue({ error: null })
    const provider = new SupabaseAuthAdministrationProvider(createEnvProvider())

    await expect(provider.removeUser('seeded-user')).resolves.toBeUndefined()
    expect(adminDeleteUser).toHaveBeenCalledWith('seeded-user')
  })

  it('resends an invitation through the Supabase invite e-mail operation', async () => {
    const user = createUser({ id: 'resent-invited-user' })
    inviteUserByEmail.mockResolvedValue({ data: { user }, error: null })
    const provider = new SupabaseAuthAdministrationProvider(createEnvProvider())

    await expect(
      provider.resendInvitation('person@example.com', 'http://localhost:3000/convite'),
    ).resolves.toEqual({ id: 'resent-invited-user', email: 'person@example.com' })
    expect(inviteUserByEmail).toHaveBeenCalledWith('person@example.com', {
      redirectTo: 'http://localhost:3000/convite',
    })
  })

  it('propagates controllable Auth invitation failures', async () => {
    const error = new Error('Auth invitation failed')
    inviteUserByEmail.mockResolvedValue({ data: { user: null }, error })
    const provider = new SupabaseAuthAdministrationProvider(createEnvProvider())

    await expect(
      provider.inviteUserByEmail('person@example.com', 'http://localhost:3000/convite'),
    ).rejects.toMatchObject({
      message: 'Não foi possível enviar o convite para o colaborador.',
    })
    await expect(
      provider.inviteUserByEmail('person@example.com', 'http://localhost:3000/convite'),
    ).rejects.toBeInstanceOf(AppError)
  })

  it('maps an existing Auth email to a conflict when resending an invitation', async () => {
    inviteUserByEmail.mockResolvedValue({
      data: { user: null },
      error: { code: 'email_exists' },
    })
    const provider = new SupabaseAuthAdministrationProvider(createEnvProvider())

    await expect(
      provider.resendInvitation('person@example.com', 'http://localhost:3000/convite'),
    ).rejects.toMatchObject({
      message:
        'Este e-mail já possui uma conta no Auth. O colaborador precisa concluir o acesso ou ser reconciliado.',
    })
    await expect(
      provider.resendInvitation('person@example.com', 'http://localhost:3000/convite'),
    ).rejects.toBeInstanceOf(ConflictError)
  })

  it('looks up emails case-insensitively and ignores user metadata markers', async () => {
    listUsers.mockResolvedValue({
      data: {
        users: [
          createUser({
            id: 'first-page-user',
            email: 'other@example.com',
            user_metadata: { hmsInvitationAttemptId: 'untrusted' },
          }),
        ],
        nextPage: 2,
      },
      error: null,
    })
    listUsers.mockResolvedValueOnce({
      data: { users: [], nextPage: 2 },
      error: null,
    })
    listUsers.mockResolvedValueOnce({
      data: {
        users: [
          createUser({
            id: 'second-page-user',
            email: 'Person@Example.com',
            app_metadata: { hmsInvitationAttemptId: 'attempt-1' },
            user_metadata: { hmsInvitationAttemptId: 'untrusted' },
          }),
        ],
        nextPage: null,
      },
      error: null,
    })
    const provider = new SupabaseAuthAdministrationProvider(createEnvProvider())

    await expect(provider.findUserByEmail(' person@example.com ')).resolves.toEqual({
      authUserId: 'second-page-user',
      email: 'Person@Example.com',
      isConfirmed: false,
      invitationAttemptId: 'attempt-1',
    })
    expect(listUsers).toHaveBeenNthCalledWith(1, { page: 1, perPage: 1000 })
    expect(listUsers).toHaveBeenNthCalledWith(2, { page: 2, perPage: 1000 })
  })

  it('writes the trusted invitation marker without dropping existing app metadata', async () => {
    const user = createUser({ app_metadata: { provider: 'email', plan: 'trial' } })
    getUserById.mockResolvedValue({ data: { user }, error: null })
    updateUserById.mockResolvedValue({ data: { user }, error: null })
    const provider = new SupabaseAuthAdministrationProvider(createEnvProvider())

    await provider.setInvitationAttemptId('user-1', 'attempt-1')

    expect(updateUserById).toHaveBeenCalledWith('user-1', {
      app_metadata: {
        provider: 'email',
        plan: 'trial',
        hmsInvitationAttemptId: 'attempt-1',
      },
    })
  })

  it('bans and unbans users through the Supabase Auth admin API', async () => {
    updateUserById.mockResolvedValue({ data: { user: createUser() }, error: null })
    const provider = new SupabaseAuthAdministrationProvider(createEnvProvider())

    await provider.setUserBanned('user-1', true)
    await provider.setUserBanned('user-1', false)

    expect(updateUserById).toHaveBeenNthCalledWith(1, 'user-1', {
      ban_duration: '876000h',
    })
    expect(updateUserById).toHaveBeenNthCalledWith(2, 'user-1', {
      ban_duration: 'none',
    })
  })

  it('revokes only the session represented by the supplied access token', async () => {
    signOut.mockResolvedValue({ error: null })
    const provider = new SupabaseAuthAdministrationProvider(createEnvProvider())

    await provider.revokeSession('access-token')

    expect(signOut).toHaveBeenCalledWith('access-token', 'local')
  })
})

function createEnvProvider(): EnvProvider {
  return {
    get: vi.fn((key: string) => {
      if (key === 'SUPABASE_URL') return 'https://supabase.example.com'
      if (key === 'SUPABASE_SERVICE_ROLE_KEY') {
        return 'header.payload.signature'
      }
      return undefined
    }),
  } as unknown as EnvProvider
}
