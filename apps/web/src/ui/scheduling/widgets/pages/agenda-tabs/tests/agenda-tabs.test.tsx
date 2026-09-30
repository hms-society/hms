import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CollaboratorProfile } from '@hms/core/identity/domain/structures'
import { AgendaTabs } from '../index'
import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'
import { useRouterState } from '@tanstack/react-router'

vi.mock('@/ui/identity/hooks/use-current-collaborator-query', () => ({
  useCurrentCollaboratorQuery: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  useRouterState: vi.fn(),
  Link: ({ children, to, className, ...rest }: any) => (
    <a href={to} className={className} {...rest}>
      {children}
    </a>
  ),
}))

const useCurrentCollaboratorQueryMock = vi.mocked(useCurrentCollaboratorQuery)
const useRouterStateMock = vi.mocked(useRouterState)

describe('AgendaTabs', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not render tabs if collaborator is not a lawyer or supervisor', () => {
    useCurrentCollaboratorQueryMock.mockReturnValue({
      currentCollaborator: {
        collaboratorId: '1',
        professionalName: 'Attendant',
        email: 'attendant@example.com',
        profile: CollaboratorProfile.Attendant,
        status: 'active',
      },
      currentCollaboratorError: null,
      isLoadingCurrentCollaborator: false,
    })
    useRouterStateMock.mockReturnValue({
      location: { pathname: '/agenda/consultas' },
    } as any)

    const { container } = render(<AgendaTabs />)
    expect(container.firstChild).toBeNull()
  })

  it('renders tabs when collaborator is a lawyer on consultas route', () => {
    useCurrentCollaboratorQueryMock.mockReturnValue({
      currentCollaborator: {
        collaboratorId: '1',
        professionalName: 'Lawyer',
        email: 'lawyer@example.com',
        profile: CollaboratorProfile.Lawyer,
        status: 'active',
      },
      currentCollaboratorError: null,
      isLoadingCurrentCollaborator: false,
    })
    useRouterStateMock.mockReturnValue({
      location: { pathname: '/agenda/consultas' },
    } as any)

    render(<AgendaTabs />)

    const consultasTab = screen.getByRole('tab', { name: 'Consultas' })
    const disponibilidadeTab = screen.getByRole('tab', { name: 'Minha disponibilidade' })

    expect(consultasTab).toBeDefined()
    expect(disponibilidadeTab).toBeDefined()
    expect(consultasTab.getAttribute('data-state')).toBe('active')
    expect(disponibilidadeTab.getAttribute('data-state')).toBe('inactive')
  })

  it('activates disponibilidade tab when on /agenda/minha-disponibilidade route', () => {
    useCurrentCollaboratorQueryMock.mockReturnValue({
      currentCollaborator: {
        collaboratorId: '1',
        professionalName: 'Lawyer',
        email: 'lawyer@example.com',
        profile: CollaboratorProfile.Lawyer,
        status: 'active',
      },
      currentCollaboratorError: null,
      isLoadingCurrentCollaborator: false,
    })
    useRouterStateMock.mockReturnValue({
      location: { pathname: '/agenda/minha-disponibilidade' },
    } as any)

    render(<AgendaTabs />)

    const consultasTab = screen.getByRole('tab', { name: 'Consultas' })
    const disponibilidadeTab = screen.getByRole('tab', { name: 'Minha disponibilidade' })

    expect(disponibilidadeTab.getAttribute('data-state')).toBe('active')
    expect(consultasTab.getAttribute('data-state')).toBe('inactive')
  })
})
