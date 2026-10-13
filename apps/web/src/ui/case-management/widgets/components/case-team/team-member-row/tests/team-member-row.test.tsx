import type { CaseTeamMember } from '@hms/core/case-management/domain/structures'
import { CaseMemberRole } from '@hms/core/case-management/domain/structures'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { TeamMemberRow } from '..'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <a {...props}>{children}</a>
  ),
}))

const member: CaseTeamMember = {
  membershipId: 'membership-1',
  collaboratorId: 'collaborator-1',
  professionalName: 'Beatriz Oliveira',
  email: 'beatriz@example.test',
  profile: 'supervisor',
  role: CaseMemberRole.Collaborator,
  assignedAt: new Date('2026-01-05T12:00:00.000Z'),
  isEligible: true,
}

function openActions() {
  const actions = screen.getByRole('button', { name: 'Ações para Beatriz Oliveira' })
  actions.focus()
  fireEvent.pointerDown(actions, { button: 0, ctrlKey: false })
  fireEvent.pointerUp(actions, { button: 0, ctrlKey: false })
  fireEvent.click(actions)
}

describe('TeamMemberRow', () => {
  it('shows the member details and forwards role-change and removal actions', () => {
    const onChangeRole = vi.fn()
    const onRemove = vi.fn()

    render(
      <table>
        <tbody>
          <TeamMemberRow
            member={member}
            activeManagerCount={1}
            canManage
            formatDate={() => '5 de jan de 2026'}
            onChangeRole={onChangeRole}
            onRemove={onRemove}
          />
        </tbody>
      </table>,
    )

    expect(screen.getByText('Beatriz Oliveira')).toBeDefined()
    expect(screen.getByText('Colaborador')).toBeDefined()
    expect(screen.getByText('5 de jan de 2026')).toBeDefined()

    openActions()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Alterar para Gestor' }))
    expect(onChangeRole).toHaveBeenCalledWith(member)

    openActions()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Remover do caso' }))
    expect(onRemove).toHaveBeenCalledWith(member)
  })
})
