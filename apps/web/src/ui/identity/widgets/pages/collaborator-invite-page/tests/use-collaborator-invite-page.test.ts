import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCompleteCollaboratorInviteAction } from '@/ui/identity/hooks/use-complete-collaborator-invite-action'
import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

import { useCollaboratorInvitePage } from '../use-collaborator-invite-page'

vi.mock('@/ui/shared/contexts/auth-context/use-auth-context', () => ({
  useAuthContext: vi.fn(),
}))

vi.mock('@/ui/identity/hooks/use-complete-collaborator-invite-action', () => ({
  useCompleteCollaboratorInviteAction: vi.fn(),
}))

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: vi.fn(),
}))

const useAuthContextMock = vi.mocked(useAuthContext)
const useCompleteCollaboratorInviteActionMock = vi.mocked(
  useCompleteCollaboratorInviteAction,
)
const useNavigationMock = vi.mocked(useNavigation)

const session = {
  accessToken: 'access-token',
  user: { id: 'user-id', email: 'invitee@example.com' },
}

const getSession = vi.fn()
const updatePassword = vi.fn()
const completeCollaboratorInvite = vi.fn()
const navigateTo = vi.fn()

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
    completeCollaboratorInvite.mockResolvedValue({
      collaboratorId: 'collaborator-id',
    })
    navigateTo.mockResolvedValue(undefined)

    useAuthContextMock.mockReturnValue({
      getSession,
      isLoading: false,
      session,
      updatePassword,
    } as never)
    useCompleteCollaboratorInviteActionMock.mockReturnValue({
      completeCollaboratorInviteError: null,
      isCompletingCollaboratorInvite: false,
      completeCollaboratorInvite,
    })
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

    const { result, rerender } = renderHook(() => useCollaboratorInvitePage())

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
    const { result } = renderHook(() => useCollaboratorInvitePage())
    changePasswords(result, password, confirmPassword)

    act(() => {
      result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(result.current.status).toBe('error')
    expect(result.current.errorMessage).toBe(message)
    expect(completeCollaboratorInvite).not.toHaveBeenCalled()
  })

  it('clears an invitation validation error when either password changes', () => {
    const { result } = renderHook(() => useCollaboratorInvitePage())
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
    const { result } = renderHook(() => useCollaboratorInvitePage())

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
    completeCollaboratorInvite.mockImplementation(async () => {
      calls.push('completeCollaboratorInvite')
      return { collaboratorId: 'collaborator-id' }
    })
    navigateTo.mockImplementation(async () => {
      calls.push('navigateTo')
    })

    const { result } = renderHook(() => useCollaboratorInvitePage())
    changePasswords(result, 'secret-password', 'secret-password')

    act(() => {
      result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(calls).toEqual(['completeCollaboratorInvite', 'navigateTo'])
    expect(navigateTo).toHaveBeenCalledWith('home')
  })

  it('exposes the service error and returns to idle when the user edits a password', async () => {
    completeCollaboratorInvite.mockRejectedValue(new Error('Convite não autorizado.'))
    const { result } = renderHook(() => useCollaboratorInvitePage())
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
    completeCollaboratorInvite.mockRejectedValue(
      new Error('Link de convite inválido ou expirado.'),
    )
    const { result } = renderHook(() => useCollaboratorInvitePage())
    changePasswords(result, 'secret-password', 'secret-password')

    act(() => {
      result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.errorMessage).toBe('Link de convite inválido ou expirado.')
  })

  it('keeps the invitation available when Supabase consumed the URL token', () => {
    const { result } = renderHook(() => useCollaboratorInvitePage())

    expect(result.current.isInviteUnavailable).toBe(false)
  })

  it('reports the pending state while the invitation request is running', async () => {
    useCompleteCollaboratorInviteActionMock.mockReturnValue({
      completeCollaboratorInviteError: null,
      isCompletingCollaboratorInvite: true,
      completeCollaboratorInvite,
    })
    const { result } = renderHook(() => useCollaboratorInvitePage())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.status).toBe('idle')
  })
})
