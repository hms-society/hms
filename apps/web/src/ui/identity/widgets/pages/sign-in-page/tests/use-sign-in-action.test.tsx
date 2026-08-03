import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RestResponse } from '@hms/core/shared/responses/rest-response'

import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

import { useSignInAction } from '../use-sign-in-action'

vi.mock('@/ui/shared/contexts/auth-context/use-auth-context', () => ({
  useAuthContext: vi.fn(),
}))

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: vi.fn(),
}))

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: vi.fn(),
}))

const useAuthContextMock = vi.mocked(useAuthContext)
const useRestContextMock = vi.mocked(useRestContext)
const useNavigationMock = vi.mocked(useNavigation)

const SESSION = {
  accessToken: 'access-token',
  user: { id: 'user-id', email: 'user@example.com' },
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })

  return function QueryWrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useSignInAction', () => {
  const signIn = vi.fn()
  const getSession = vi.fn()
  const signOut = vi.fn()
  const completeSignIn = vi.fn()
  const navigateTo = vi.fn()
  const calls: string[] = []

  beforeEach(() => {
    vi.clearAllMocks()
    calls.length = 0
    signIn.mockImplementation(async () => {
      calls.push('signIn')
      return SESSION
    })
    getSession.mockImplementation(async () => {
      calls.push('getSession')
      return SESSION
    })
    completeSignIn.mockImplementation(async () => {
      calls.push('completeSignIn')
      return new RestResponse({ body: { collaboratorId: 'collaborator-id' } })
    })
    signOut.mockImplementation(async () => {
      calls.push('signOut')
    })
    navigateTo.mockImplementation(async () => {
      calls.push('navigate')
    })

    useAuthContextMock.mockReturnValue({ signIn, getSession, signOut } as never)
    useRestContextMock.mockReturnValue({ identityService: { completeSignIn } } as never)
    useNavigationMock.mockReturnValue({
      navigateTo,
      navigateCollaboratorsSearch: vi.fn(),
    })
  })

  it('completes the local sign-in before navigating home', async () => {
    const { result } = renderHook(() => useSignInAction(), { wrapper: createWrapper() })

    result.current.signIn({ email: 'user@example.com', password: 'secret' })

    await waitFor(() => expect(navigateTo).toHaveBeenCalledWith('home'))

    expect(calls).toEqual(['signIn', 'getSession', 'completeSignIn', 'navigate'])
    expect(signOut).not.toHaveBeenCalled()
  })

  it('signs out and keeps navigation stopped when local completion fails', async () => {
    const errorResponse = new RestResponse({
      statusCode: 403,
      errorMessage: 'Conta sem acesso ativo.',
    })
    completeSignIn.mockResolvedValue(errorResponse)

    const { result } = renderHook(() => useSignInAction(), { wrapper: createWrapper() })

    result.current.signIn({ email: 'user@example.com', password: 'secret' })

    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1))

    expect(navigateTo).not.toHaveBeenCalled()
    expect(result.current.error?.message).toBe('Conta sem acesso ativo.')
    expect(calls).toEqual(['signIn', 'getSession', 'signOut'])
  })
})
