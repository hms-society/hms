import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CaseMemberRole } from '@hms/core/case-management/domain/structures'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { createQueryHookTestWrapper } from './query-hook-test-utils'
import { useChangeCaseTeamMemberRoleAction } from '../use-change-case-team-member-role-action'

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({ useRestContext: vi.fn() }))

const restContextMock = vi.mocked(useRestContext)
const caseManagementService = { changeCaseTeamMemberRole: vi.fn() }
const createRequest = (operationId: string) => ({
  membershipId: 'membership-1',
  request: {
    operationId,
    role: CaseMemberRole.Collaborator,
    expectedTeamVersion: 3,
  },
})

function failure(statusCode: number) {
  const throwError = vi.fn(() => {
    throw new Error(`Request failed with ${statusCode}`)
  })
  return { isFailure: true, statusCode, throwError }
}

describe('useChangeCaseTeamMemberRoleAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    restContextMock.mockReturnValue({ caseManagementService } as never)
  })
  afterEach(() => vi.restoreAllMocks())

  it('changes the role, returns the response and invalidates team-related data', async () => {
    const request = createRequest('00000000-0000-4000-8000-000000000101')
    const body = { teamVersion: 4 }
    caseManagementService.changeCaseTeamMemberRole.mockResolvedValue({
      isFailure: false,
      body,
    })
    const { wrapper, queryClient } = createQueryHookTestWrapper()
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useChangeCaseTeamMemberRoleAction('case-1'), {
      wrapper,
    })

    await act(async () => {
      await expect(result.current.changeCaseTeamMemberRole(request)).resolves.toEqual(
        body,
      )
    })

    expect(caseManagementService.changeCaseTeamMemberRole).toHaveBeenCalledWith(
      'case-1',
      'membership-1',
      request.request,
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
    expect(result.current.isChangingCaseTeamMemberRole).toBe(false)
    expect(result.current.changeCaseTeamMemberRoleError).toBeNull()
  })

  it('purges case data after a forbidden response', async () => {
    const request = createRequest('00000000-0000-4000-8000-000000000102')
    const response = failure(403)
    caseManagementService.changeCaseTeamMemberRole.mockResolvedValue(response)
    const { wrapper, queryClient } = createQueryHookTestWrapper()
    const relatedKey = ['case-management', 'team', 'case-1']
    const unrelatedKey = ['case-management', 'team', 'case-2']
    const detailKey = ['case-details', 'case-1']
    queryClient.setQueryData(relatedKey, { secret: true })
    queryClient.setQueryData(unrelatedKey, { retained: true })
    queryClient.setQueryData(detailKey, { secret: true })
    const { result } = renderHook(() => useChangeCaseTeamMemberRoleAction('case-1'), {
      wrapper,
    })

    await act(async () => {
      await result.current.changeCaseTeamMemberRole(request).catch(() => undefined)
    })
    await waitFor(() =>
      expect(result.current.changeCaseTeamMemberRoleError).toBeInstanceOf(Error),
    )

    expect(response.throwError).toHaveBeenCalledOnce()
    expect(queryClient.getQueryData(relatedKey)).toBeUndefined()
    expect(queryClient.getQueryData(detailKey)).toBeUndefined()
    expect(queryClient.getQueryData(unrelatedKey)).toEqual({ retained: true })
  })

  it('preserves cached data for non-forbidden errors and supports resetting the mutation', async () => {
    const request = createRequest('00000000-0000-4000-8000-000000000103')
    const response = failure(500)
    caseManagementService.changeCaseTeamMemberRole.mockResolvedValue(response)
    const { wrapper, queryClient } = createQueryHookTestWrapper()
    const key = ['case-management', 'team', 'case-1']
    queryClient.setQueryData(key, { retained: true })
    const { result } = renderHook(() => useChangeCaseTeamMemberRoleAction('case-1'), {
      wrapper,
    })

    await act(async () => {
      await result.current.changeCaseTeamMemberRole(request).catch(() => undefined)
    })
    await waitFor(() =>
      expect(result.current.changeCaseTeamMemberRoleError).toBeInstanceOf(Error),
    )
    expect(queryClient.getQueryData(key)).toEqual({ retained: true })
    act(() => result.current.resetChangeCaseTeamMemberRole())
    await waitFor(() => expect(result.current.changeCaseTeamMemberRoleError).toBeNull())
  })
})
