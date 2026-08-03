import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RestResponse } from '@hms/core/shared/responses/rest-response'

import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

import { useCollaboratorInvitePage } from '../use-collaborator-invite-page'

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

const session = {
  accessToken: 'access-token',
  user: { id: 'user-id', email: 'invitee@example.com' },
}

const getSession = vi.fn()
const updatePassword = vi.fn()
const completeSignIn = vi.fn()
const navigateTo = vi.fn()

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })

  return function QueryWrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

function changePasswords(
  result: { current: ReturnType<typeof useCollaboratorInvitePage> },
  password: string,
  confirmPassword: string,
) {
  act(() => {
    result.current.handlePasswordChange({ target: { value: password } } as never)
    result.current.handleConfirmPasswordChange({
      target: { value: confirmPassword },
    } as never)
  })
}

describe('useCollaboratorInvitePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSession.mockResolvedValue(session)
    updatePassword.mockResolvedValue(undefined)
    completeSignIn.mockResolvedValue(
      new RestResponse({ body: { collaboratorId: 'collaborator-id' } }),
    )
    navigateTo.mockResolvedValue(undefined)

    useAuthContextMock.mockReturnValue({
      getSession,
      isLoading: false,
      session,
      updatePassword,
    } as never)
    useRestContextMock.mockReturnValue({ identityService: { completeSignIn } } as never)
    useNavigationMock.mockReturnValue({
      navigateTo,
      navigateCollaboratorsSearch: vi.fn(),
    })
  })

  it('marks the session as checked after authentication loading finishes', async () => {
    let isLoading = true
    useAuthContextMock.mockImplementation(
      () =>
        ({
          getSession,
          isLoading,
          session: null,
          updatePassword,
        }) as never,
    )

    const { result, rerender } = renderHook(() => useCollaboratorInvitePage(), {
      wrapper: createWrapper(),
    })

    expect(result.current.hasCheckedSession).toBe(false)

    isLoading = false
    rerender()

    await waitFor(() => expect(result.current.hasCheckedSession).toBe(true))
  })

  it.each([
    ['short password', '12345', '12345', 'Use pelo menos 6 caracteres.'],
    [
      'mismatched passwords',
      'secret-password',
      'different-password',
      'As senhas não coincidem.',
    ],
  ])('rejects a %s before calling the invitation services', (_caseName, password, confirmPassword, message) => {
    const { result } = renderHook(() => useCollaboratorInvitePage(), {
      wrapper: createWrapper(),
    })
    changePasswords(result, password, confirmPassword)

    act(() => {
      result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(result.current.status).toBe('error')
    expect(result.current.errorMessage).toBe(message)
    expect(getSession).not.toHaveBeenCalled()
    expect(updatePassword).not.toHaveBeenCalled()
    expect(completeSignIn).not.toHaveBeenCalled()
  })

  it('clears an invitation validation error when either password changes', () => {
    const { result } = renderHook(() => useCollaboratorInvitePage(), {
      wrapper: createWrapper(),
    })
    changePasswords(result, '12345', '12345')

    act(() => {
      result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })
    expect(result.current.status).toBe('error')

    act(() => {
      result.current.handlePasswordChange({
        target: { value: 'secret-password' },
      } as never)
    })

    expect(result.current.status).toBe('idle')
  })

  it('toggles password visibility', () => {
    const { result } = renderHook(() => useCollaboratorInvitePage(), {
      wrapper: createWrapper(),
    })

    expect(result.current.showPassword).toBe(false)
    act(() => result.current.handleTogglePasswordVisibility())
    expect(result.current.showPassword).toBe(true)
    act(() => result.current.handleTogglePasswordVisibility())
    expect(result.current.showPassword).toBe(false)
  })

  it('completes the session before navigating home', async () => {
    const calls: string[] = []
    getSession.mockImplementation(async () => {
      calls.push('getSession')
      return session
    })
    updatePassword.mockImplementation(async () => {
      calls.push('updatePassword')
    })
    completeSignIn.mockImplementation(async () => {
      calls.push('completeSignIn')
      return new RestResponse({ body: { collaboratorId: 'collaborator-id' } })
    })
    navigateTo.mockImplementation(async () => {
      calls.push('navigateTo')
    })

    const { result } = renderHook(() => useCollaboratorInvitePage(), {
      wrapper: createWrapper(),
    })
    changePasswords(result, 'secret-password', 'secret-password')

    act(() => {
      result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(calls).toEqual([
      'getSession',
      'updatePassword',
      'completeSignIn',
      'navigateTo',
    ])
    expect(navigateTo).toHaveBeenCalledWith('home')
  })

  it('exposes the service error and returns to idle when the user edits a password', async () => {
    completeSignIn.mockResolvedValue(
      new RestResponse({ statusCode: 403, errorMessage: 'Convite não autorizado.' }),
    )
    const { result } = renderHook(() => useCollaboratorInvitePage(), {
      wrapper: createWrapper(),
    })
    changePasswords(result, 'secret-password', 'secret-password')

    act(() => {
      result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.errorMessage).toBe('Convite não autorizado.')
    expect(navigateTo).not.toHaveBeenCalled()

    act(() => {
      result.current.handleConfirmPasswordChange({
        target: { value: 'secret-password' },
      } as never)
    })

    expect(result.current.status).toBe('idle')
  })

  it('rejects the request when the session expires before submission', async () => {
    getSession.mockResolvedValue(null)
    const { result } = renderHook(() => useCollaboratorInvitePage(), {
      wrapper: createWrapper(),
    })
    changePasswords(result, 'secret-password', 'secret-password')

    act(() => {
      result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.errorMessage).toBe('Link de convite inválido ou expirado.')
    expect(updatePassword).not.toHaveBeenCalled()
    expect(completeSignIn).not.toHaveBeenCalled()
  })

  it('reports the pending state while the invitation request is running', async () => {
    let resolveCompletion: (response: RestResponse) => void = () => undefined
    completeSignIn.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCompletion = resolve
        }),
    )
    const { result } = renderHook(() => useCollaboratorInvitePage(), {
      wrapper: createWrapper(),
    })
    changePasswords(result, 'secret-password', 'secret-password')

    act(() => {
      result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    await waitFor(() => expect(result.current.isLoading).toBe(true))
    expect(result.current.status).toBe('idle')

    await act(async () => {
      resolveCompletion(new RestResponse({ body: { collaboratorId: 'collaborator-id' } }))
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.status).toBe('success')
  })
})
