import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CaseMemberRole } from '@hms/core/case-management/domain/structures'
import type {
  CaseTeam,
  CaseTeamMember,
} from '@hms/core/case-management/domain/structures'
import type { PendingMutation } from '../../use-case-team-mutation'
import { TeamMutationDialog } from '..'

afterEach(cleanup)

const member = (role: CaseMemberRole) =>
  ({
    membershipId: 'membership-1',
    collaboratorId: 'collaborator-1',
    role,
  }) as CaseTeamMember

function renderRemovalDialog(role: CaseMemberRole, activeManagerCount: number) {
  const onOpenChange = vi.fn()
  render(
    <TeamMutationDialog
      caseTeam={
        {
          activeManagerCount,
          requiresAdministrativeReason: true,
        } as CaseTeam
      }
      mutation={{ kind: 'remove', member: member(role) } as PendingMutation}
      reason=''
      error={null}
      hasVersionConflict={false}
      isPending={false}
      onOpenChange={onOpenChange}
      onReasonChange={vi.fn()}
      onConfirm={vi.fn()}
    />,
  )
  return onOpenChange
}

describe('TeamMutationDialog', () => {
  it('does not flag a collaborator removal as the last-manager removal', () => {
    renderRemovalDialog(CaseMemberRole.Collaborator, 1)

    expect(screen.getByRole('heading', { name: 'Remover do caso' })).toBeTruthy()
    expect(screen.queryByText(/última pessoa com nível Gestor/)).toBeNull()
  })

  it('guards removing the only active manager and lets the user cancel', () => {
    const onOpenChange = renderRemovalDialog(CaseMemberRole.Manager, 1)

    expect(screen.getByText(/Pelo menos uma pessoa deve permanecer/)).toBeTruthy()
    fireEvent.click(screen.getAllByRole('button', { name: 'Cancelar' })[0])
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
