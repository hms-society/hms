import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCaseTeamMutation } from '@/ui/case-management/widgets/components/case-team/use-case-team-mutation'
import { useCaseTeamQuery } from '@/ui/case-management/hooks/use-case-team-query'
import { useCaseTeamRoster } from '../use-case-team-roster'

vi.mock('@/ui/case-management/hooks/use-case-team-query', () => ({
  useCaseTeamQuery: vi.fn(),
}))
vi.mock('@/ui/case-management/widgets/components/case-team/use-case-team-mutation', () => ({
  useCaseTeamMutation: vi.fn(),
}))

const useCaseTeamQueryMock = vi.mocked(useCaseTeamQuery)
const useCaseTeamMutationMock = vi.mocked(useCaseTeamMutation)

function createCaseTeam(overrides: Record<string, unknown> = {}) {
  return {
    caseId: 'case-1',
    status: 'documentation',
    teamVersion: 1,
    members: [],
    total: 0,
    activeManagerCount: 1,
    canManage: true,
    requiresAdministrativeReason: false,
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  useCaseTeamQueryMock.mockReturnValue({
    caseTeam: createCaseTeam() as never,
    caseTeamError: null,
    isLoadingCaseTeam: false,
    refetchCaseTeam: vi.fn(),
  })
  useCaseTeamMutationMock.mockReturnValue({} as never)
})

describe('useCaseTeamRoster', () => {
  it('permits mutations only when the loaded case grants management access and is open', () => {
    const { result } = renderHook(() => useCaseTeamRoster('case-1'))

    expect(result.current.canManageActiveTeam).toBe(true)
    expect(useCaseTeamMutationMock).toHaveBeenCalledWith(
      'case-1',
      expect.objectContaining({ status: 'documentation', canManage: true }),
      expect.any(Function),
    )
  })

  it.each([
    ['closed cases', createCaseTeam({ status: 'closed' }), null],
    ['cases without permission', createCaseTeam({ canManage: false }), null],
    ['failed team queries', createCaseTeam(), new Error('Forbidden')],
  ])('keeps mutation permission disabled for %s', (_label, caseTeam, caseTeamError) => {
    useCaseTeamQueryMock.mockReturnValue({
      caseTeam: caseTeam as never,
      caseTeamError: caseTeamError as never,
      isLoadingCaseTeam: false,
      refetchCaseTeam: vi.fn(),
    })

    const { result } = renderHook(() => useCaseTeamRoster('case-1'))

    expect(result.current.canManageActiveTeam).toBe(false)
  })
})
