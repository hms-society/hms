import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { createQueryHookTestWrapper } from './query-hook-test-utils'
import { useCaseTeamQuery } from '../use-case-team-query'

vi.mock('@/ui/identity/hooks/use-current-collaborator-query', () => ({
  useCurrentCollaboratorQuery: vi.fn(),
}))
vi.mock('@/ui/shared/hooks/use-rest-context', () => ({ useRestContext: vi.fn() }))

const currentCollaboratorMock = vi.mocked(useCurrentCollaboratorQuery)
const restContextMock = vi.mocked(useRestContext)
const caseManagementService = { getCaseTeam: vi.fn() }
const collaborator = { collaboratorId: 'collaborator-1' }

function failure(statusCode: number) {
  const throwError = vi.fn(() => {
    throw new Error(`Request failed with ${statusCode}`)
  })
  return { isFailure: true, statusCode, throwError }
}

describe('useCaseTeamQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentCollaboratorMock.mockReturnValue({
      currentCollaborator: collaborator,
    } as never)
    restContextMock.mockReturnValue({ caseManagementService } as never)
  })
  afterEach(() => vi.restoreAllMocks())

  it('loads the case team for the current collaborator', async () => {
    const team = { caseId: 'case-1', teamVersion: 3 }
    caseManagementService.getCaseTeam.mockResolvedValue({ isFailure: false, body: team })
    const { wrapper, queryClient } = createQueryHookTestWrapper()
    const { result } = renderHook(() => useCaseTeamQuery('case-1'), { wrapper })

    await waitFor(() => expect(result.current.caseTeam).toEqual(team))
    expect(caseManagementService.getCaseTeam).toHaveBeenCalledWith('case-1')
    expect(
      queryClient
        .getQueryCache()
        .find({ queryKey: ['case-management', 'team', 'case-1', 'collaborator-1'] }),
    ).toBeDefined()
    expect(result.current.caseTeamError).toBeNull()
    expect(result.current.isLoadingCaseTeam).toBe(false)
  })

  it.each([
    ['empty case ID', '', collaborator],
    ['missing collaborator', 'case-1', null],
  ])('does not query when the %s is unavailable', async (_label, caseId, current) => {
    currentCollaboratorMock.mockReturnValue({ currentCollaborator: current } as never)
    const { wrapper } = createQueryHookTestWrapper()
    const { result } = renderHook(() => useCaseTeamQuery(caseId), { wrapper })

    await act(async () => Promise.resolve())
    expect(caseManagementService.getCaseTeam).not.toHaveBeenCalled()
    expect(result.current.caseTeam).toBeNull()
    expect(result.current.isLoadingCaseTeam).toBe(false)
  })

  it('purges related protected queries on forbidden responses and exposes the error', async () => {
    const response = failure(403)
    caseManagementService.getCaseTeam.mockResolvedValue(response)
    const { wrapper, queryClient } = createQueryHookTestWrapper()
    const keys = [
      ['case-details', 'case-1'],
      ['case-management', 'my-cases'],
      ['case-management', 'cases', 'case-1'],
      ['case-portal-access', 'case-1'],
      ['third-parties'],
    ]
    for (const key of keys) queryClient.setQueryData(key, { protected: true })
    const { result } = renderHook(() => useCaseTeamQuery('case-1'), { wrapper })

    await waitFor(() => expect(result.current.caseTeamError).toBeInstanceOf(Error))
    expect(response.throwError).toHaveBeenCalledOnce()
    for (const key of keys) expect(queryClient.getQueryData(key)).toBeUndefined()
    expect(result.current.caseTeam).toBeNull()
    expect(result.current.isLoadingCaseTeam).toBe(false)
  })

  it('preserves cached queries for non-forbidden failures', async () => {
    const response = failure(500)
    caseManagementService.getCaseTeam.mockResolvedValue(response)
    const { wrapper, queryClient } = createQueryHookTestWrapper()
    const key = ['case-details', 'case-1']
    queryClient.setQueryData(key, { retained: true })
    const { result } = renderHook(() => useCaseTeamQuery('case-1'), { wrapper })

    await waitFor(() => expect(result.current.caseTeamError).toBeInstanceOf(Error))
    expect(response.throwError).toHaveBeenCalledOnce()
    expect(queryClient.getQueryData(key)).toEqual({ retained: true })
  })
})
