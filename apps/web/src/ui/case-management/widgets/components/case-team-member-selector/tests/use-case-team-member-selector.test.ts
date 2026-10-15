import { act, renderHook } from '@testing-library/react'
import { CaseMemberRole } from '@hms/core/case-management/domain/structures'
import { CollaboratorProfile } from '@hms/core/identity/domain/structures'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCaseTeamCandidatesQuery } from '@/ui/case-management/hooks/use-case-team-candidates-query'
import { useCaseTeamMemberSelector } from '../use-case-team-member-selector'

vi.mock('@/ui/case-management/hooks/use-case-team-candidates-query', () => ({
  useCaseTeamCandidatesQuery: vi.fn(),
}))

const query = vi.mocked(useCaseTeamCandidatesQuery)
const candidate = {
  collaboratorId: 'collaborator-1',
  professionalName: 'Dra. Ana Advogada',
  email: 'ana@example.test',
  profile: CollaboratorProfile.Lawyer,
  status: 'active',
} as never

describe('useCaseTeamMemberSelector', () => {
  beforeEach(() => {
    query.mockReturnValue({
      caseTeamCandidates: {
        items: [candidate],
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      },
      caseTeamCandidatesError: null,
      isLoadingCaseTeamCandidates: false,
      refetchCaseTeamCandidates: vi.fn(),
    } as never)
  })

  it('filters candidates, resets selection on search, and confirms the selected role', () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()
    const { result } = renderHook(() =>
      useCaseTeamMemberSelector({
        open: true,
        caseId: 'case-1',
        onClose,
        onSelect,
      }),
    )

    act(() => result.current.handleCollaboratorSelect(candidate))
    expect(result.current.selectedCollaborator).toEqual(candidate)
    act(() => result.current.handleRoleChange(CaseMemberRole.Manager))
    act(() => result.current.handleConfirmSelection())
    expect(onSelect).toHaveBeenCalledWith(candidate, CaseMemberRole.Manager)
    expect(onClose).toHaveBeenCalledOnce()

    act(() => result.current.handleCollaboratorSelect(candidate))
    act(() => result.current.handleSearchChange('ana'))
    expect(result.current.selectedCollaborator).toBeNull()
    expect(query).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'ana', page: 1 }),
    )
  })

  it('restricts the manager picker to lawyers and one role', () => {
    const { result } = renderHook(() =>
      useCaseTeamMemberSelector({
        open: true,
        onClose: vi.fn(),
        onSelect: vi.fn(),
        requiredProfile: CollaboratorProfile.Lawyer,
        allowedRoles: [CaseMemberRole.Manager],
        initialRole: CaseMemberRole.Manager,
      }),
    )
    expect(result.current.isSingleRole).toBe(true)
    expect(query).toHaveBeenLastCalledWith(
      expect.objectContaining({ profile: CollaboratorProfile.Lawyer }),
    )
  })

  it('labels supported collaborator profiles and preserves an unknown profile label', () => {
    const { result } = renderHook(() =>
      useCaseTeamMemberSelector({
        open: true,
        onClose: vi.fn(),
        onSelect: vi.fn(),
      }),
    )

    expect(result.current.getProfileLabel(CollaboratorProfile.Lawyer)).toBe('Advogado')
    expect(result.current.getProfileLabel(CollaboratorProfile.Paralegal)).toBe(
      'Paralegal',
    )
    expect(result.current.getProfileLabel(CollaboratorProfile.Supervisor)).toBe(
      'Supervisor',
    )
    expect(result.current.getProfileLabel(CollaboratorProfile.Admin)).toBe(
      CollaboratorProfile.Admin,
    )
  })

  it('ignores unavailable roles and does nothing when confirmation has no selection', () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()
    const { result } = renderHook(() =>
      useCaseTeamMemberSelector({
        open: true,
        onClose,
        onSelect,
        allowedRoles: [CaseMemberRole.Collaborator],
      }),
    )

    act(() => result.current.handleRoleChange(CaseMemberRole.Manager))
    act(() => result.current.handleConfirmSelection())

    expect(result.current.role).toBe(CaseMemberRole.Collaborator)
    expect(onSelect).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('clears selection and resets the page when filters change or are cleared', () => {
    const { result } = renderHook(() =>
      useCaseTeamMemberSelector({
        open: true,
        onClose: vi.fn(),
        onSelect: vi.fn(),
        requiredProfile: CollaboratorProfile.Lawyer,
      }),
    )

    act(() => result.current.handleCollaboratorSelect(candidate))
    act(() => result.current.handleProfileChange(CollaboratorProfile.Paralegal))
    expect(result.current.profile).toBe(CollaboratorProfile.Paralegal)
    expect(result.current.selectedCollaborator).toBeNull()

    act(() => result.current.handleCollaboratorSelect(candidate))
    act(() => result.current.handleSearchChange('ana'))
    expect(result.current.selectedCollaborator).toBeNull()
    expect(result.current.search).toBe('ana')

    act(() => result.current.handleClearFilters())
    expect(result.current.search).toBe('')
    expect(result.current.profile).toBe(CollaboratorProfile.Lawyer)
    expect(result.current.page).toBe(1)
    expect(result.current.selectedCollaborator).toBeNull()
  })

  it('bounds pagination, clears selection and resets state when reopened', () => {
    query.mockReturnValue({
      caseTeamCandidates: {
        items: [candidate],
        page: 1,
        pageSize: 20,
        total: 41,
        totalPages: 3,
      },
      caseTeamCandidatesError: null,
      isLoadingCaseTeamCandidates: false,
      refetchCaseTeamCandidates: vi.fn(),
    } as never)
    const props = {
      open: true,
      caseId: 'case-1',
      onClose: vi.fn(),
      onSelect: vi.fn(),
      initialRole: CaseMemberRole.Manager,
    }
    const { result, rerender } = renderHook(
      (currentProps) => useCaseTeamMemberSelector(currentProps),
      { initialProps: props },
    )

    act(() => result.current.handlePreviousPage())
    expect(result.current.page).toBe(1)
    act(() => result.current.handleCollaboratorSelect(candidate))
    act(() => result.current.handleNextPage())
    expect(result.current.page).toBe(2)
    expect(result.current.selectedCollaborator).toBeNull()
    act(() => result.current.handleNextPage())
    act(() => result.current.handleNextPage())
    expect(result.current.page).toBe(3)

    act(() => result.current.handleSearchChange('stale'))
    act(() => result.current.handleCollaboratorSelect(candidate))
    rerender({ ...props, open: false })
    rerender(props)
    expect(result.current.search).toBe('')
    expect(result.current.page).toBe(1)
    expect(result.current.selectedCollaborator).toBeNull()
    expect(result.current.role).toBe(CaseMemberRole.Manager)
  })
})
