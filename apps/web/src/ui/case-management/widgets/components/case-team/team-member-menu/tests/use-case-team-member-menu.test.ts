import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CaseMemberRole } from '@hms/core/case-management/domain/structures'
import { useCaseTeam } from '../../use-case-team'

const mocks = vi.hoisted(() => ({ caseTeam: null as any, remove: vi.fn() }))
vi.mock('@/ui/case-management/hooks/use-case-team-query', () => ({
  useCaseTeamQuery: () => ({
    caseTeam: mocks.caseTeam,
    caseTeamError: null,
    isLoadingCaseTeam: false,
    refetchCaseTeam: vi.fn(),
  }),
}))
vi.mock('@/ui/case-management/hooks/use-add-case-team-member-action', () => ({
  useAddCaseTeamMemberAction: () => ({
    addCaseTeamMember: vi.fn(),
    isAddingCaseTeamMember: false,
  }),
}))
vi.mock('@/ui/case-management/hooks/use-change-case-team-member-role-action', () => ({
  useChangeCaseTeamMemberRoleAction: () => ({
    changeCaseTeamMemberRole: vi.fn(),
    isChangingCaseTeamMemberRole: false,
  }),
}))
vi.mock('@/ui/case-management/hooks/use-remove-case-team-member-action', () => ({
  useRemoveCaseTeamMemberAction: () => ({
    removeCaseTeamMember: mocks.remove,
    isRemovingCaseTeamMember: false,
  }),
}))

const manager = {
  membershipId: 'm1',
  collaboratorId: 'c1',
  professionalName: 'Ana Gestora',
  email: 'ana@example.test',
  profile: 'lawyer',
  status: 'active',
  role: CaseMemberRole.Manager,
  assignedAt: new Date(),
  isEligible: true,
}
beforeEach(() => {
  vi.clearAllMocks()
  mocks.caseTeam = {
    caseId: 'case-1',
    status: 'documentation',
    teamVersion: 1,
    members: [manager],
    total: 1,
    activeManagerCount: 1,
    canManage: true,
    requiresAdministrativeReason: false,
  }
})

describe('case team member menu contract', () => {
  it('prevents removing the last active Manager from the case', () => {
    const { result } = renderHook(() => useCaseTeam('case-1'))
    act(() => result.current.handleBeginRemoval(manager as never))
    expect(result.current.pendingMutation).toBeNull()
    expect(mocks.remove).not.toHaveBeenCalled()
  })
})
