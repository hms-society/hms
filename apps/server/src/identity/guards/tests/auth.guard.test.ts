import { UnauthorizedException, type ExecutionContext } from '@nestjs/common'
import {
  AuthSessionFaker,
  AuthUserFaker,
} from '@hms/core/identity/domain/structures/fakers'
import { UserFaker } from '@hms/core/identity/domain/entities/fakers'
import type { AuthProvider, UsersRepository } from '@hms/core/identity/interfaces'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthGuard } from '@/identity/guards/auth.guard'

describe('Auth Guard', () => {
  let getSession: ReturnType<typeof vi.fn>
  let findById: ReturnType<typeof vi.fn>
  let authProvider: AuthProvider
  let usersRepository: UsersRepository
  let guard: AuthGuard

  beforeEach(() => {
    getSession = vi.fn()
    findById = vi.fn()
    authProvider = { getSession } as unknown as AuthProvider
    usersRepository = { findById } as unknown as UsersRepository
    guard = new AuthGuard(authProvider, usersRepository)
  })

  it('rejects a valid Supabase session when the local account is disabled', async () => {
    const authUser = AuthUserFaker.fake()
    getSession.mockResolvedValue(AuthSessionFaker.fake({ user: authUser }))
    findById.mockResolvedValue(UserFaker.fake({ id: authUser.id, status: 'disabled' }))

    await expect(guard.canActivate(createContext())).rejects.toBeInstanceOf(
      UnauthorizedException,
    )
  })

  it('hydrates the request for an active local account', async () => {
    const authUser = AuthUserFaker.fake()
    const session = AuthSessionFaker.fake({ user: authUser })
    const request = createRequest()
    getSession.mockResolvedValue(session)
    findById.mockResolvedValue(UserFaker.fake({ id: authUser.id, status: 'active' }))

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true)
    expect(request.user).toBe(authUser)
    expect(request.auth).toBe(session)
    expect(request.identity).toEqual({ auth: session, user: authUser })
  })
})

type Request = {
  headers: { authorization?: string }
  auth?: unknown
  user?: unknown
  identity?: unknown
}

function createRequest(): Request {
  return { headers: { authorization: 'Bearer access-token' } }
}

function createContext(request = createRequest()): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as ExecutionContext
}
