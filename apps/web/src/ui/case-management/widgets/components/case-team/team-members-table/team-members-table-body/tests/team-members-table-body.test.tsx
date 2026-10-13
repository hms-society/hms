import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CaseMemberRole } from '@hms/core/case-management/domain/structures'
import type {
  CaseTeam,
  CaseTeamMember,
} from '@hms/core/case-management/domain/structures'
import { TeamMembersTableBody } from '..'

afterEach(cleanup)

const member = (overrides: Partial<CaseTeamMember> = {}): CaseTeamMember =>
  ({
    membershipId: 'membership-1',
    collaboratorId: 'collaborator-1',
    professionalName: 'Ana Advogada',
    email: 'ana@example.test',
    profile: 'lawyer',
    status: 'active',
    role: CaseMemberRole.Manager,
    assignedAt: '2026-10-01T00:00:00.000Z',
    isEligible: true,
    ...overrides,
  }) as CaseTeamMember

const renderBody = (
  options: { team?: CaseTeam; isLoading?: boolean; canManage?: boolean } = {},
) =>
  render(
    <table>
      <TeamMembersTableBody
        team={options.team}
        isLoading={options.isLoading ?? false}
        canManage={options.canManage ?? false}
        formatDate={() => '1 de out. de 2026'}
        onChangeRole={vi.fn()}
        onRemove={vi.fn()}
      />
    </table>,
  )

describe('TeamMembersTableBody', () => {
  it('shows loading and empty states', () => {
    const { rerender } = renderBody({ isLoading: true })
    expect(screen.getByText('Carregando equipe…')).toBeTruthy()

    rerender(
      <table>
        <TeamMembersTableBody
          isLoading={false}
          canManage={false}
          formatDate={() => ''}
          onChangeRole={vi.fn()}
          onRemove={vi.fn()}
        />
      </table>,
    )
    expect(screen.getByText('Nenhum integrante vigente foi encontrado.')).toBeTruthy()
  })

  it('renders identity, eligibility, access role and last-manager status', () => {
    renderBody({
      canManage: true,
      team: {
        members: [
          member({ isEligible: false }),
          member({
            membershipId: 'membership-2',
            collaboratorId: 'collaborator-2',
            professionalName: 'Bruno Colaborador',
            role: CaseMemberRole.Collaborator,
          }),
        ],
        activeManagerCount: 1,
      } as CaseTeam,
    })

    expect(screen.getByText('Ana Advogada')).toBeTruthy()
    expect(screen.getAllByText('ana@example.test')).toHaveLength(2)
    expect(screen.getByText('Perfil ou status não elegível')).toBeTruthy()
    expect(screen.getByText('Último Gestor ativo')).toBeTruthy()
    expect(screen.getByText('Gestor')).toBeTruthy()
    expect(screen.getByText('Colaborador')).toBeTruthy()
    expect(screen.getAllByText('1 de out. de 2026')).toHaveLength(2)

    expect(
      screen
        .getByRole('button', { name: 'Ações para Bruno Colaborador' })
        .getAttribute('aria-haspopup'),
    ).toBe('menu')
  })
})
