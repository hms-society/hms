import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CaseMemberRole } from '@hms/core/case-management/domain/structures'
import { ConflictError } from '@hms/core/shared/domain/errors'
import { useCaseTeam } from '../use-case-team'

const mocks = vi.hoisted(() => ({
  addCaseTeamMember: vi.fn(),
  changeCaseTeamMemberRole: vi.fn(),
  removeCaseTeamMember: vi.fn(),
  refetchCaseTeam: vi.fn(),
  caseTeam: null as any,
}))

vi.mock('@/ui/case-management/hooks/use-case-team-query', () => ({
  useCaseTeamQuery: () => ({
    caseTeam: mocks.caseTeam,
    caseTeamError: null,
    isLoadingCaseTeam: false,
    refetchCaseTeam: mocks.refetchCaseTeam,
  }),
}))
vi.mock('@/ui/case-management/hooks/use-add-case-team-member-action', () => ({
  useAddCaseTeamMemberAction: () => ({
    addCaseTeamMember: mocks.addCaseTeamMember,
    isAddingCaseTeamMember: false,
  }),
}))
vi.mock('@/ui/case-management/hooks/use-change-case-team-member-role-action', () => ({
  useChangeCaseTeamMemberRoleAction: () => ({
    changeCaseTeamMemberRole: mocks.changeCaseTeamMemberRole,
    isChangingCaseTeamMemberRole: false,
  }),
}))
vi.mock('@/ui/case-management/hooks/use-remove-case-team-member-action', () => ({
  useRemoveCaseTeamMemberAction: () => ({
    removeCaseTeamMember: mocks.removeCaseTeamMember,
    isRemovingCaseTeamMember: false,
  }),
}))

const lawyer = {
  collaboratorId: '00000000-0000-4000-8000-000000000001',
  professionalName: 'Advogada Teste',
  email: 'advogada@example.test',
  profile: 'lawyer',
  status: 'active',
}
const manager = {
  membershipId: 'membership-1',
  ...lawyer,
  role: CaseMemberRole.Manager,
  assignedAt: new Date('2026-01-01T00:00:00.000Z'),
  isEligible: true,
}
const collaborator = {
  membershipId: 'membership-2',
  collaboratorId: '00000000-0000-4000-8000-000000000002',
  professionalName: 'Colaborador Teste',
  email: 'colaborador@example.test',
  profile: 'paralegal',
  status: 'active',
  role: CaseMemberRole.Collaborator,
  assignedAt: new Date('2026-01-02T00:00:00.000Z'),
  isEligible: true,
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.caseTeam = {
    caseId: 'case-1',
    publicCode: 'CASE-1',
    status: 'documentation',
    teamVersion: 4,
    members: [manager],
    total: 1,
    activeManagerCount: 1,
    canManage: true,
    requiresAdministrativeReason: true,
  }
})

describe('useCaseTeam', () => {
  it('allows team management only for an open team with permission', () => {
    const { result, rerender } = renderHook(() => useCaseTeam('case-1'))
    expect(result.current.canManageTeam).toBe(true)

    mocks.caseTeam = { ...mocks.caseTeam, status: 'closed' }
    rerender()
    expect(result.current.isClosed).toBe(true)
    expect(result.current.canManageTeam).toBe(false)

    mocks.caseTeam = null
    rerender()
    expect(result.current.caseTeam).toBeNull()
    expect(result.current.canManageTeam).toBe(false)
  })

  it('formats team member assignment dates in Brazilian Portuguese', () => {
    const { result } = renderHook(() => useCaseTeam('case-1'))

    expect(result.current.formatDate(new Date('2026-01-05T12:00:00.000Z'))).toContain(
      'jan',
    )
    expect(result.current.formatDate('2026-01-05T12:00:00.000Z')).toContain('2026')
  })

  it('prevents removing the last active Manager', () => {
    const { result } = renderHook(() => useCaseTeam('case-1'))

    act(() => result.current.handleBeginRemoval(manager as any))

    expect(result.current.pendingMutation).toBeNull()
    expect(mocks.removeCaseTeamMember).not.toHaveBeenCalled()
  })

  it('adds an Admin team member without a reason and sends the current team version', async () => {
    mocks.addCaseTeamMember.mockResolvedValue({ historyId: 'history-1' })
    const { result } = renderHook(() => useCaseTeam('case-1'))

    act(() =>
      result.current.handleSelectCandidate(lawyer as any, CaseMemberRole.Collaborator),
    )
    await act(async () => result.current.handleConfirmMutation())

    expect(mocks.addCaseTeamMember).toHaveBeenCalledWith(
      expect.objectContaining({
        collaboratorId: lawyer.collaboratorId,
        role: CaseMemberRole.Collaborator,
        expectedTeamVersion: 4,
      }),
    )
    expect(mocks.addCaseTeamMember.mock.calls[0][0]).not.toHaveProperty('reason')
    expect(result.current.pendingMutation).toBeNull()
  })

  it('changes a member role without an administrative reason when the field is empty', async () => {
    mocks.caseTeam = {
      ...mocks.caseTeam,
      members: [manager, collaborator],
      activeManagerCount: 1,
    }
    mocks.changeCaseTeamMemberRole.mockResolvedValue({ historyId: 'history-role' })
    const { result } = renderHook(() => useCaseTeam('case-1'))

    act(() => result.current.handleBeginRoleChange(collaborator as any))
    expect(result.current.pendingMutation).toMatchObject({
      kind: 'role',
      member: collaborator,
      role: CaseMemberRole.Manager,
    })
    await act(async () => result.current.handleConfirmMutation())

    expect(mocks.changeCaseTeamMemberRole).toHaveBeenCalledWith({
      membershipId: collaborator.membershipId,
      request: expect.objectContaining({
        expectedTeamVersion: 4,
        role: CaseMemberRole.Manager,
      }),
    })
    expect(mocks.changeCaseTeamMemberRole.mock.calls[0][0].request).not.toHaveProperty(
      'reason',
    )
    expect(result.current.pendingMutation).toBeNull()
  })

  it('accepts a short administrative reason when removing a collaborator', async () => {
    mocks.caseTeam = { ...mocks.caseTeam, members: [manager, collaborator] }
    mocks.removeCaseTeamMember.mockResolvedValue({ historyId: 'history-removal' })
    const { result } = renderHook(() => useCaseTeam('case-1'))

    act(() => result.current.handleBeginRemoval(collaborator as any))
    act(() => result.current.handleReasonChange('x'))
    await act(async () => result.current.handleConfirmMutation())

    expect(mocks.removeCaseTeamMember).toHaveBeenCalledWith({
      membershipId: collaborator.membershipId,
      request: expect.objectContaining({ expectedTeamVersion: 4, reason: 'x' }),
    })
    expect(result.current.pendingMutation).toBeNull()
  })
})

describe('useCaseTeam recovery', () => {
  it('refetches on conflict and requires a second confirmation with a new operation', async () => {
    mocks.caseTeam.requiresAdministrativeReason = false
    mocks.addCaseTeamMember.mockRejectedValueOnce(new ConflictError('Version conflict'))
    mocks.addCaseTeamMember.mockResolvedValueOnce({ historyId: 'history-2' })
    const { result, rerender } = renderHook(() => useCaseTeam('case-1'))
    act(() =>
      result.current.handleSelectCandidate(lawyer as any, CaseMemberRole.Collaborator),
    )
    await act(async () => result.current.handleConfirmMutation())
    const firstRequest = mocks.addCaseTeamMember.mock.calls[0][0]
    expect(mocks.refetchCaseTeam).toHaveBeenCalledOnce()
    expect(mocks.addCaseTeamMember).toHaveBeenCalledTimes(1)
    expect(result.current.hasVersionConflict).toBe(true)
    expect(result.current.mutationError).toMatch(/confirme novamente/)
    expect(result.current.pendingMutation).not.toBeNull()
    mocks.caseTeam = { ...mocks.caseTeam, teamVersion: 5 }
    rerender()
    await act(async () => result.current.handleConfirmMutation())
    const confirmedRequest = mocks.addCaseTeamMember.mock.calls[1][0]
    expect(confirmedRequest.expectedTeamVersion).toBe(5)
    expect(confirmedRequest.operationId).not.toBe(firstRequest.operationId)
    expect(result.current.pendingMutation).toBeNull()
  })

  it('preserves the exact request and operation ID after an unknown result', async () => {
    mocks.caseTeam.requiresAdministrativeReason = false
    mocks.addCaseTeamMember.mockRejectedValueOnce(new Error('Connection lost'))
    mocks.addCaseTeamMember.mockResolvedValueOnce({ historyId: 'history-2' })
    const { result } = renderHook(() => useCaseTeam('case-1'))
    act(() =>
      result.current.handleSelectCandidate(lawyer as any, CaseMemberRole.Collaborator),
    )
    await act(async () => result.current.handleConfirmMutation())
    expect(result.current.mutationError).toBe('Connection lost')
    expect(result.current.pendingMutation).not.toBeNull()
    expect(result.current.hasVersionConflict).toBe(false)
    const originalRequest = mocks.addCaseTeamMember.mock.calls[0][0]
    expect(originalRequest.operationId).toEqual(expect.any(String))
    await act(async () => result.current.handleConfirmMutation())
    expect(mocks.addCaseTeamMember.mock.calls[1][0]).toEqual(originalRequest)
    expect(result.current.pendingMutation).toBeNull()
    expect(result.current.mutationError).toBeNull()
  })
})
