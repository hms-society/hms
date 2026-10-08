import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { createQueryHookTestWrapper } from './query-hook-test-utils'
import { useAddCaseTeamMemberAction } from '../use-add-case-team-member-action'

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({ useRestContext: vi.fn() }))

const restContextMock = vi.mocked(useRestContext)
const caseManagementService = { addCaseTeamMember: vi.fn() }
const request = { collaboratorId: 'collaborator-2', role: 'collaborator' } as never

function failure(statusCode: number) {
  const throwError = vi.fn(() => {
    throw new Error(`Request failed with ${statusCode}`)
  })
  return { isFailure: true, statusCode, throwError }
}

describe('useAddCaseTeamMemberAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    restContextMock.mockReturnValue({ caseManagementService } as never)
  })
  afterEach(() => vi.restoreAllMocks())

  it('adds a member, returns the response and invalidates team-related data', async () => {
    const body = { teamVersion: 4 }
    caseManagementService.addCaseTeamMember.mockResolvedValue({ isFailure: false, body })
    const { wrapper, queryClient } = createQueryHookTestWrapper()
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useAddCaseTeamMemberAction('case-1'), { wrapper })

    await act(async () => {
      await expect(result.current.addCaseTeamMember(request)).resolves.toEqual(body)
    })

    expect(caseManagementService.addCaseTeamMember).toHaveBeenCalledWith(
      'case-1',
      request,
    )
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['case-management', 'team', 'case-1'],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['case-management', 'team-history', 'case-1'],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['case-details', 'case-1'],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['case-management', 'my-cases'],
    })
    expect(result.current.isAddingCaseTeamMember).toBe(false)
    expect(result.current.addCaseTeamMemberError).toBeNull()
  })

  it('purges case data after a forbidden response', async () => {
    const response = failure(403)
    caseManagementService.addCaseTeamMember.mockResolvedValue(response)
    const { wrapper, queryClient } = createQueryHookTestWrapper()
    const relatedKey = ['case-management', 'cases', 'case-1']
    const unrelatedKey = ['case-management', 'cases', 'case-2']
    const detailKey = ['case-details', 'case-1']
    queryClient.setQueryData(relatedKey, { secret: true })
    queryClient.setQueryData(unrelatedKey, { retained: true })
    queryClient.setQueryData(detailKey, { secret: true })
    const { result } = renderHook(() => useAddCaseTeamMemberAction('case-1'), { wrapper })

    await act(async () => {
      await result.current.addCaseTeamMember(request).catch(() => undefined)
    })
    await waitFor(() =>
      expect(result.current.addCaseTeamMemberError).toBeInstanceOf(Error),
    )

    expect(response.throwError).toHaveBeenCalledOnce()
    expect(queryClient.getQueryData(relatedKey)).toBeUndefined()
    expect(queryClient.getQueryData(detailKey)).toBeUndefined()
    expect(queryClient.getQueryData(unrelatedKey)).toEqual({ retained: true })
  })

  it('does not clear cached data for other mutation failures and can reset its error', async () => {
    const response = failure(500)
    caseManagementService.addCaseTeamMember.mockResolvedValue(response)
    const { wrapper, queryClient } = createQueryHookTestWrapper()
    const key = ['case-management', 'cases', 'case-1']
    queryClient.setQueryData(key, { retained: true })
    const { result } = renderHook(() => useAddCaseTeamMemberAction('case-1'), { wrapper })

    await act(async () => {
      await result.current.addCaseTeamMember(request).catch(() => undefined)
    })
    await waitFor(() =>
      expect(result.current.addCaseTeamMemberError).toBeInstanceOf(Error),
    )
    expect(queryClient.getQueryData(key)).toEqual({ retained: true })
    act(() => result.current.resetAddCaseTeamMember())
    await waitFor(() => expect(result.current.addCaseTeamMemberError).toBeNull())
  })
})
