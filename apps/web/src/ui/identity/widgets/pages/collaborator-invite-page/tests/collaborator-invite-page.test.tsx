import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RestResponse } from '@hms/core/shared/responses/rest-response'

import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'
import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

import { CollaboratorInvitePage } from '../index'

vi.mock('@/ui/shared/contexts/auth-context/use-auth-context', () => ({
  useAuthContext: vi.fn(),
}))

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: vi.fn(),
}))

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: vi.fn(),
}))

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, route, ...props }: AnchorProps) => (
    <a href={route} {...props}>
      {children}
    </a>
  ),
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
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

function renderPage() {
  return render(<CollaboratorInvitePage />, { wrapper: createWrapper() })
}

function getInviteForm() {
  const form = screen.getByRole('button', { name: 'Criar minha senha' }).closest('form')

  if (!form) throw new Error('The invite form is not rendered.')

  return form
}

describe('CollaboratorInvitePage', () => {
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

  afterEach(cleanup)

  it('renders the password form after the invite session is checked', async () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Defina sua senha' })).toBeTruthy()
    expect(screen.getByLabelText('Nova senha').getAttribute('type')).toBe('password')
    expect(screen.getByLabelText('Confirmar senha').getAttribute('type')).toBe('password')
    expect(
      (screen.getByRole('button', { name: 'Criar minha senha' }) as HTMLButtonElement)
        .disabled,
    ).toBe(false)
    expect(screen.getByRole('link', { name: 'Voltar para o login' })).toBeTruthy()
  })

  it('disables the form while the invite session is loading', () => {
    useAuthContextMock.mockReturnValue({
      getSession,
      isLoading: true,
      session: null,
      updatePassword,
    } as never)

    renderPage()

    expect(screen.getByLabelText('Nova senha').hasAttribute('disabled')).toBe(true)
    expect(screen.getByLabelText('Confirmar senha').hasAttribute('disabled')).toBe(true)
    expect(
      screen.getByRole('button', { name: 'Salvando…' }).hasAttribute('disabled'),
    ).toBe(true)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('shows an unavailable state when the invite session is missing', async () => {
    useAuthContextMock.mockReturnValue({
      getSession: vi.fn().mockResolvedValue(null),
      isLoading: false,
      session: null,
      updatePassword,
    } as never)

    renderPage()

    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Criar minha senha' })).toBeNull()
  })

  it('shows a validation error without completing an invalid password pair', () => {
    renderPage()

    fireEvent.change(screen.getByLabelText('Nova senha'), {
      target: { value: 'secret' },
    })
    fireEvent.change(screen.getByLabelText('Confirmar senha'), {
      target: { value: 'different' },
    })
    fireEvent.submit(getInviteForm())

    expect(screen.getByRole('alert').textContent).toContain('As senhas não coincidem.')
    expect(getSession).not.toHaveBeenCalled()
    expect(updatePassword).not.toHaveBeenCalled()
    expect(completeSignIn).not.toHaveBeenCalled()
  })

  it('completes the invite and navigates home after creating the password', async () => {
    renderPage()

    fireEvent.change(screen.getByLabelText('Nova senha'), {
      target: { value: 'secret-password' },
    })
    fireEvent.change(screen.getByLabelText('Confirmar senha'), {
      target: { value: 'secret-password' },
    })
    fireEvent.submit(getInviteForm())

    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toContain(
        'Senha criada. Redirecionando para a HMS…',
      ),
    )
    expect(updatePassword).toHaveBeenCalledWith('secret-password')
    expect(completeSignIn).toHaveBeenCalledOnce()
    expect(navigateTo).toHaveBeenCalledWith('home')
  })

  it('shows the completion error and keeps the form available for retry', async () => {
    completeSignIn.mockResolvedValue(
      new RestResponse({ statusCode: 403, errorMessage: 'Convite não autorizado.' }),
    )

    renderPage()

    fireEvent.change(screen.getByLabelText('Nova senha'), {
      target: { value: 'secret-password' },
    })
    fireEvent.change(screen.getByLabelText('Confirmar senha'), {
      target: { value: 'secret-password' },
    })
    fireEvent.submit(getInviteForm())

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Convite não autorizado.',
    )
    expect(
      (screen.getByRole('button', { name: 'Criar minha senha' }) as HTMLButtonElement)
        .disabled,
    ).toBe(false)
  })
})
