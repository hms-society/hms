import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { CaseTeam } from '../..'
import { useCaseTeam } from '../../use-case-team'

vi.mock('../../use-case-team', () => ({ useCaseTeam: vi.fn() }))
vi.mock('@/ui/case-management/widgets/components/case-team-member-selector', () => ({
  CaseTeamMemberSelector: () => null,
}))

function createTeamState(pendingMutation: unknown, reason = '') {
  return {
    caseTeam: {
      status: 'documentation',
      total: 2,
      activeManagerCount: 1,
      canManage: true,
      requiresAdministrativeReason: true,
      members: [],
    },
    canManageTeam: true,
    isClosed: false,
    isLoadingCaseTeam: false,
    caseTeamError: null,
    formatDate: () => '',
    handleBeginRemoval: vi.fn(),
    handleBeginRoleChange: vi.fn(),
    handleCloseSelector: vi.fn(),
    handleSelectCandidate: vi.fn(),
    handleConfirmMutation: vi.fn(),
    handleOpenSelector: vi.fn(),
    handlePendingMutationOpenChange: vi.fn(),
    handleReasonChange: vi.fn(),
    handleRetryCaseTeam: vi.fn(),
    hasVersionConflict: false,
    isMutationPending: false,
    isSelectorOpen: false,
    mutationError: null,
    pendingMutation,
    reason,
  } as never
}

describe('case team mutation confirmation', () => {
  it('does not ask Admin for a reason when adding a team member', () => {
    vi.mocked(useCaseTeam).mockReturnValue(
      createTeamState({
        kind: 'add',
        candidate: {
          collaboratorId: 'c2',
          professionalName: 'Bia Colaboradora',
        },
        role: 'collaborator',
      }),
    )

    render(<CaseTeam caseId='case-1' />)
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.queryByLabelText('Justificativa administrativa')).toBeNull()
    expect(
      screen.getByRole('button', { name: 'Confirmar' }).hasAttribute('disabled'),
    ).toBe(false)
  })

  it('shows an optional Admin reason when changing access level', () => {
    vi.mocked(useCaseTeam).mockReturnValue(
      createTeamState(
        {
          kind: 'role',
          member: { membershipId: 'member-1', professionalName: 'Beatriz Oliveira' },
          role: 'collaborator',
        },
        'ok',
      ),
    )

    render(<CaseTeam caseId='case-1' />)
    expect(screen.getByLabelText('Justificativa administrativa')).toBeTruthy()
    expect(screen.getByText(/Opcional/)).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Confirmar' }).hasAttribute('disabled'),
    ).toBe(false)
  })

  it('allows a short nonblank Admin removal reason and requires a value', () => {
    vi.mocked(useCaseTeam).mockReturnValue(
      createTeamState(
        {
          kind: 'remove',
          member: { membershipId: 'member-1', professionalName: 'Beatriz Oliveira' },
        },
        'ok',
      ),
    )

    const { rerender } = render(<CaseTeam caseId='case-1' />)
    expect(screen.getByLabelText('Justificativa administrativa')).toBeTruthy()
    expect(
      screen.getByText('Obrigatória para registrar a remoção no histórico.'),
    ).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Remover do caso' }).hasAttribute('disabled'),
    ).toBe(false)

    vi.mocked(useCaseTeam).mockReturnValue(
      createTeamState(
        {
          kind: 'remove',
          member: { membershipId: 'member-1', professionalName: 'Beatriz Oliveira' },
        },
        '   ',
      ),
    )
    rerender(<CaseTeam caseId='case-1' />)
    expect(
      screen.getByRole('button', { name: 'Remover do caso' }).hasAttribute('disabled'),
    ).toBe(true)
  })
})
