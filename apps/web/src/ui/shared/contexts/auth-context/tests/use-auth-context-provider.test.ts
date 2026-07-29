import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  AuthSession,
  AuthStateChangeListener,
} from '@hms/core/identity/domain/structures'
import type { AuthProvider } from '@hms/core/identity/interfaces'

import { useAuthContextProvider } from '../use-auth-context-provider'

const SESSION: AuthSession = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  user: {
    id: 'user-id',
    email: 'attendant@hms.test',
  },
}

describe('useAuthContextProvider', () => {
  let authStateChangeListener: AuthStateChangeListener
  let authProvider: AuthProvider

  beforeEach(() => {
    authProvider = {
      createUser: vi.fn(),
      getSession: vi.fn().mockResolvedValue(SESSION),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn((listener: AuthStateChangeListener) => {
        authStateChangeListener = listener
        return vi.fn()
      }),
      requestPasswordReset: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
      updatePassword: vi.fn(),
    }
  })

  it('keeps the persisted session when a late initial event has no session', async () => {
    const { result } = renderHook(() => useAuthContextProvider(authProvider))

    await waitFor(() => expect(result.current.session).toEqual(SESSION))

    act(() => {
      authStateChangeListener('INITIAL_SESSION', null)
    })

    expect(result.current.session).toEqual(SESSION)
    expect(result.current.isLoading).toBe(false)
  })

  it('clears the session after an explicit signed-out event', async () => {
    const { result } = renderHook(() => useAuthContextProvider(authProvider))

    await waitFor(() => expect(result.current.session).toEqual(SESSION))

    act(() => {
      authStateChangeListener('SIGNED_OUT', null)
    })

    expect(result.current.session).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })
})
