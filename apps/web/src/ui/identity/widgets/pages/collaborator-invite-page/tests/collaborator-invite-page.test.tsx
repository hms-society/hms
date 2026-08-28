import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useCompleteCollaboratorInviteAction } from '@/ui/identity/hooks/use-complete-collaborator-invite-action'
import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'
import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

import { CollaboratorInvitePage } from '../index'

vi.mock('@/ui/shared/contexts/auth-context/use-auth-context', () => ({
  useAuthContext: vi.fn(),
}))

vi.mock('@/ui/identity/hooks/use-complete-collaborator-invite-action', () => ({
  useCompleteCollaboratorInviteAction: vi.fn(),
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

function renderPage() {
  return render(<CollaboratorInvitePage inviteSearch={{ code: 'invite-code' }} />)
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

  it('shows an unavailable state when the invite URL contains an auth error', async () => {
    render(
      <CollaboratorInvitePage
        inviteSearch={{
          error: 'access_denied',
          error_code: 'otp_expired',
          error_description: 'Email link is invalid or has expired',
        }}
      />,
    )

    expect((await screen.findByRole('alert')).textContent).toContain(
      'O link de convite é inválido ou expirou.',
    )
    expect(screen.queryByRole('button', { name: 'Criar minha senha' })).toBeNull()
  })

  it('renders the password form when the invite token was consumed into a session', () => {
    render(<CollaboratorInvitePage />)

    expect(screen.getByRole('button', { name: 'Criar minha senha' })).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('shows an unavailable state when the URL has no invite token or session', async () => {
    useAuthContextMock.mockReturnValue({
      getSession: vi.fn().mockResolvedValue(null),
      isLoading: false,
      session: null,
      updatePassword,
    } as never)

    render(<CollaboratorInvitePage />)

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Abra esta página pelo link recebido no convite.',
    )
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
    expect(completeCollaboratorInvite).not.toHaveBeenCalled()
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
    expect(completeCollaboratorInvite).toHaveBeenCalledWith('secret-password')
    expect(navigateTo).toHaveBeenCalledWith('home')
  })

  it('shows the completion error and keeps the form available for retry', async () => {
    completeCollaboratorInvite.mockRejectedValue(new Error('Convite não autorizado.'))

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
