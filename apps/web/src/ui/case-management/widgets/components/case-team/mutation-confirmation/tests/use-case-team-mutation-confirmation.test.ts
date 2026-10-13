import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CaseMemberRole } from '@hms/core/case-management/domain/structures'
import { useCaseTeam } from '../../use-case-team'

const mocks = vi.hoisted(() => ({
  caseTeam: null as any,
  add: vi.fn(),
  change: vi.fn(),
  remove: vi.fn(),
}))
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
    addCaseTeamMember: mocks.add,
    isAddingCaseTeamMember: false,
  }),
}))
vi.mock('@/ui/case-management/hooks/use-change-case-team-member-role-action', () => ({
  useChangeCaseTeamMemberRoleAction: () => ({
    changeCaseTeamMemberRole: mocks.change,
    isChangingCaseTeamMemberRole: false,
  }),
}))
vi.mock('@/ui/case-management/hooks/use-remove-case-team-member-action', () => ({
  useRemoveCaseTeamMemberAction: () => ({
    removeCaseTeamMember: mocks.remove,
    isRemovingCaseTeamMember: false,
  }),
}))

const candidate = {
  collaboratorId: 'c2',
  professionalName: 'Bia Colaboradora',
  email: 'bia@example.test',
  profile: 'lawyer',
  status: 'active',
}
beforeEach(() => {
  vi.clearAllMocks()
  mocks.caseTeam = {
    caseId: 'case-1',
    status: 'documentation',
    teamVersion: 4,
    members: [],
    total: 0,
    activeManagerCount: 0,
    canManage: true,
    requiresAdministrativeReason: true,
  }
})

describe('case team mutation confirmation contract', () => {
  it('adds a team member as Admin without asking for or sending a reason', async () => {
    mocks.add.mockResolvedValue({ historyId: 'history-1' })
    const { result } = renderHook(() => useCaseTeam('case-1'))
    act(() =>
      result.current.handleSelectCandidate(
        candidate as never,
        CaseMemberRole.Collaborator,
      ),
    )
    await act(async () => result.current.handleConfirmMutation())
    expect(mocks.add).toHaveBeenCalledWith(
      expect.objectContaining({ expectedTeamVersion: 4 }),
    )
    expect(mocks.add.mock.calls[0][0]).not.toHaveProperty('reason')
    expect(result.current.mutationError).toBeNull()
  })

  it('allows an Admin role change without a reason', async () => {
    mocks.change.mockResolvedValue({ historyId: 'history-2' })
    const { result } = renderHook(() => useCaseTeam('case-1'))
    const member = {
      membershipId: 'membership-1',
      collaboratorId: candidate.collaboratorId,
      professionalName: candidate.professionalName,
      role: CaseMemberRole.Collaborator,
      isEligible: true,
    }

    act(() => result.current.handleBeginRoleChange(member as never))
    await act(async () => result.current.handleConfirmMutation())
    expect(mocks.change).toHaveBeenCalledWith({
      membershipId: 'membership-1',
      request: expect.objectContaining({ expectedTeamVersion: 4 }),
    })
    expect(mocks.change.mock.calls[0][0].request).not.toHaveProperty('reason')
    expect(result.current.mutationError).toBeNull()

    mocks.change.mockClear()
    act(() => result.current.handleBeginRoleChange(member as never))
    act(() => result.current.handleReasonChange('curto'))
    await act(async () => result.current.handleConfirmMutation())
    expect(mocks.change).toHaveBeenCalledWith({
      membershipId: 'membership-1',
      request: expect.objectContaining({ reason: 'curto', expectedTeamVersion: 4 }),
    })
    expect(result.current.mutationError).toBeNull()

    mocks.change.mockClear()
    act(() => result.current.handleBeginRoleChange(member as never))
    act(() => result.current.handleReasonChange(''))
    await act(async () => result.current.handleConfirmMutation())
    expect(mocks.change).toHaveBeenCalledOnce()
    expect(mocks.change.mock.calls[0][0].request).not.toHaveProperty('reason')

    mocks.change.mockClear()
    act(() => result.current.handleBeginRoleChange(member as never))
    act(() => result.current.handleReasonChange('  motivo valido  '))
    await act(async () => result.current.handleConfirmMutation())
    expect(mocks.change).toHaveBeenCalledWith({
      membershipId: 'membership-1',
      request: expect.objectContaining({
        reason: 'motivo valido',
        expectedTeamVersion: 4,
      }),
    })
  })

  it('requires nonblank Admin removal reason and submits the trimmed short value', async () => {
    mocks.remove.mockResolvedValue({ historyId: 'history-3' })
    const { result } = renderHook(() => useCaseTeam('case-1'))
    const member = {
      membershipId: 'membership-2',
      collaboratorId: candidate.collaboratorId,
      professionalName: candidate.professionalName,
      role: CaseMemberRole.Collaborator,
      isEligible: true,
    }

    act(() => result.current.handleBeginRemoval(member as never))
    await act(async () => result.current.handleConfirmMutation())
    expect(mocks.remove).not.toHaveBeenCalled()
    expect(result.current.mutationError).toBe('Informe uma justificativa administrativa.')

    act(() => result.current.handleReasonChange('   '))
    await act(async () => result.current.handleConfirmMutation())
    expect(mocks.remove).not.toHaveBeenCalled()

    act(() => result.current.handleReasonChange('  ok  '))
    await act(async () => result.current.handleConfirmMutation())
    expect(mocks.remove).toHaveBeenCalledWith({
      membershipId: 'membership-2',
      request: expect.objectContaining({ reason: 'ok', expectedTeamVersion: 4 }),
    })
    expect(result.current.mutationError).toBeNull()
  })
})
