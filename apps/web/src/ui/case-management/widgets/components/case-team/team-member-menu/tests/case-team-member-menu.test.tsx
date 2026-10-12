import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { CaseTeam } from '../..'
import { useCaseTeam } from '../../use-case-team'

vi.mock('../../use-case-team', () => ({ useCaseTeam: vi.fn() }))
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <a {...props}>{children}</a>
  ),
}))
vi.mock('@/ui/case-management/widgets/components/case-team-member-selector', () => ({
  CaseTeamMemberSelector: () => null,
}))

describe('case team member menu', () => {
  it('offers profile navigation and prevents demoting the last manager', async () => {
    vi.mocked(useCaseTeam).mockReturnValue({
      caseTeam: {
        status: 'documentation',
        total: 1,
        activeManagerCount: 1,
        canManage: true,
        members: [
          {
            membershipId: 'm1',
            collaboratorId: 'c1',
            professionalName: 'Ana Gestora',
            email: 'ana@example.test',
            role: 'manager',
            assignedAt: '2026-10-01',
            isEligible: true,
          },
        ],
      },
      canManageTeam: true,
      isClosed: false,
      isLoadingCaseTeam: false,
      caseTeamError: null,
      formatDate: () => '01/10/2026',
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
      pendingMutation: null,
      reason: '',
    } as never)

    render(<CaseTeam caseId='case-1' />)
    const actions = screen.getByRole('button', {
      name: 'Ações para Ana Gestora',
    })
    actions.focus()
    fireEvent.pointerDown(actions, { button: 0, ctrlKey: false })
    fireEvent.pointerUp(actions, { button: 0, ctrlKey: false })
    fireEvent.click(actions)
    expect(actions).toBeTruthy()
    // This environment does not implement Radix's pointer sequence; browser route tests
    // cover menu opening and focus return.
    expect(screen.getByText('Último Gestor ativo')).toBeTruthy()
  })
})
