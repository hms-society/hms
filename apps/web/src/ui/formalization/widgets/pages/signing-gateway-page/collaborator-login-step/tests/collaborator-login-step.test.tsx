import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ROUTES } from '@/constants/routes'
import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'

import { CollaboratorLoginStep } from '../index'
import { useCollaboratorLoginStep } from '../use-collaborator-login-step'

vi.mock('../use-collaborator-login-step', () => ({ useCollaboratorLoginStep: vi.fn() }))
vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, route, search, ...props }: AnchorProps) => (
    <a
      href={`${ROUTES[route]}${search?.returnTo ? `?returnTo=${encodeURIComponent(String(search.returnTo))}` : ''}`}
      {...props}
    >
      {children}
    </a>
  ),
}))

describe('CollaboratorLoginStep', () => {
  afterEach(cleanup)

  it('renders the safe relative login destination', () => {
    vi.mocked(useCollaboratorLoginStep).mockReturnValue({
      description: 'Entre na HMS para continuar com a assinatura.',
      handleContinue: vi.fn(),
      isPending: false,
      loginSearch: { returnTo: ROUTES.signingGateway },
    })
    render(
      <CollaboratorLoginStep
        loginPath='/login?returnTo=%2Fassinaturas%2Facesso'
        isPending={false}
        onContinue={vi.fn()}
      />,
    )
    expect(screen.getByRole('link', { name: 'Entrar' }).getAttribute('href')).toBe(
      '/login?returnTo=%2Fassinaturas%2Facesso',
    )
  })

  it('offers an account switch without discarding the signing flow', () => {
    vi.mocked(useCollaboratorLoginStep).mockReturnValue({
      description:
        'A conta atual não é o colaborador atribuído. Entre com a conta correta para continuar.',
      handleContinue: vi.fn(),
      isPending: false,
      loginSearch: { returnTo: ROUTES.signingGateway },
    })
    render(
      <CollaboratorLoginStep
        error='account_mismatch'
        loginPath='/login?returnTo=%2Fassinaturas%2Facesso'
        isPending={false}
        onContinue={vi.fn()}
      />,
    )
    expect(screen.getByRole('alert').textContent).toContain('conta correta')
    expect(
      screen.getByRole('link', { name: 'Trocar de conta' }).getAttribute('href'),
    ).toBe('/login?returnTo=%2Fassinaturas%2Facesso')
  })
})
