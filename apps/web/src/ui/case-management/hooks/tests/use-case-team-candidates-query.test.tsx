import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { createQueryHookTestWrapper } from './query-hook-test-utils'
import { useCaseTeamCandidatesQuery } from '../use-case-team-candidates-query'

vi.mock('@/ui/identity/hooks/use-current-collaborator-query', () => ({
  useCurrentCollaboratorQuery: vi.fn(),
}))
vi.mock('@/ui/shared/hooks/use-rest-context', () => ({ useRestContext: vi.fn() }))

const currentCollaboratorMock = vi.mocked(useCurrentCollaboratorQuery)
const restContextMock = vi.mocked(useRestContext)
const caseManagementService = { listCaseTeamCandidates: vi.fn() }
const collaborator = { collaboratorId: 'collaborator-1' }
const params = {
  caseId: 'case-1',
  enabled: true,
  page: 2,
  pageSize: 20,
  profile: 'lawyer',
  search: ' Ana ',
} as const

function failure(statusCode: number) {
  const throwError = vi.fn(() => {
    throw new Error(`Request failed with ${statusCode}`)
  })
  return { isFailure: true, statusCode, throwError }
}

describe('useCaseTeamCandidatesQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentCollaboratorMock.mockReturnValue({
      currentCollaborator: collaborator,
    } as never)
    restContextMock.mockReturnValue({ caseManagementService } as never)
  })
  afterEach(() => vi.restoreAllMocks())

  it('loads candidates and retains search, profile, page and collaborator in its key', async () => {
    const candidates = { items: [{ collaboratorId: 'candidate-1' }], totalPages: 1 }
    caseManagementService.listCaseTeamCandidates.mockResolvedValue({
      isFailure: false,
      body: candidates,
    })
    const { wrapper, queryClient } = createQueryHookTestWrapper()
    const { result } = renderHook(() => useCaseTeamCandidatesQuery(params), { wrapper })

    await waitFor(() => expect(result.current.caseTeamCandidates).toEqual(candidates))
    expect(caseManagementService.listCaseTeamCandidates).toHaveBeenCalledWith(
      { page: 2, pageSize: 20, profile: 'lawyer', search: ' Ana ' },
      'case-1',
    )
    expect(
      queryClient.getQueryCache().find({
        queryKey: [
          'case-management',
          'team-candidates',
          'case-1',
          'collaborator-1',
          'Ana',
          'lawyer',
          2,
          20,
        ],
      }),
    ).toBeDefined()
    expect(result.current.caseTeamCandidatesError).toBeNull()
    expect(result.current.isLoadingCaseTeamCandidates).toBe(false)
  })

  it('normalizes omitted search and profile filters in the query key', async () => {
    caseManagementService.listCaseTeamCandidates.mockResolvedValue({
      isFailure: false,
      body: { items: [], totalPages: 0 },
    })
    const { wrapper, queryClient } = createQueryHookTestWrapper()
    const { result } = renderHook(
      () =>
        useCaseTeamCandidatesQuery({
          ...params,
          profile: undefined,
          search: undefined,
        }),
      { wrapper },
    )

    await waitFor(() => expect(result.current.caseTeamCandidates?.totalPages).toBe(0))
    expect(
      queryClient.getQueryCache().find({
        queryKey: [
          'case-management',
          'team-candidates',
          'case-1',
          'collaborator-1',
          '',
          null,
          2,
          20,
        ],
      }),
    ).toBeDefined()
  })

  it('does not query when disabled or when there is no current collaborator', async () => {
    const { wrapper } = createQueryHookTestWrapper()
    const disabled = renderHook(
      () => useCaseTeamCandidatesQuery({ ...params, enabled: false }),
      { wrapper },
    )
    currentCollaboratorMock.mockReturnValue({ currentCollaborator: null } as never)
    const noCollaborator = renderHook(() => useCaseTeamCandidatesQuery(params), {
      wrapper,
    })
    await act(async () => Promise.resolve())

    expect(caseManagementService.listCaseTeamCandidates).not.toHaveBeenCalled()
    expect(disabled.result.current.caseTeamCandidates).toBeNull()
    expect(noCollaborator.result.current.caseTeamCandidates).toBeNull()
  })

  it('removes only matching candidate cache entries on forbidden responses', async () => {
    const response = failure(403)
    caseManagementService.listCaseTeamCandidates.mockResolvedValue(response)
    const { wrapper, queryClient } = createQueryHookTestWrapper()
    const protectedKey = [
      'case-management',
      'team-candidates',
      'case-1',
      'collaborator-1',
      'old-search',
      null,
      1,
      20,
    ]
    const unrelatedKey = [
      'case-management',
      'team-candidates',
      'case-2',
      'collaborator-1',
      '',
      null,
      1,
      20,
    ]
    const wrongScopeKey = ['other', ...protectedKey.slice(1)]
    const wrongQueryKey = ['case-management', 'other', ...protectedKey.slice(2)]
    const wrongCollaboratorKey = [
      ...protectedKey.slice(0, 3),
      'collaborator-2',
      ...protectedKey.slice(4),
    ]
    queryClient.setQueryData(protectedKey, { retained: false })
    queryClient.setQueryData(unrelatedKey, { retained: true })
    queryClient.setQueryData(wrongScopeKey, { retained: true })
    queryClient.setQueryData(wrongQueryKey, { retained: true })
    queryClient.setQueryData(wrongCollaboratorKey, { retained: true })
    renderHook(() => useCaseTeamCandidatesQuery(params), { wrapper })
    await waitFor(() => expect(response.throwError).toHaveBeenCalledOnce())
    expect(response.throwError).toHaveBeenCalledOnce()
    expect(queryClient.getQueryCache().find({ queryKey: protectedKey })).toBeUndefined()
    expect(queryClient.getQueryData(unrelatedKey)).toEqual({ retained: true })
    expect(queryClient.getQueryData(wrongScopeKey)).toEqual({ retained: true })
    expect(queryClient.getQueryData(wrongQueryKey)).toEqual({ retained: true })
    expect(queryClient.getQueryData(wrongCollaboratorKey)).toEqual({ retained: true })
  })

  it('keeps candidate caches for non-forbidden failures', async () => {
    const response = failure(500)
    caseManagementService.listCaseTeamCandidates.mockResolvedValue(response)
    const { wrapper, queryClient } = createQueryHookTestWrapper()
    const key = [
      'case-management',
      'team-candidates',
      'case-2',
      'collaborator-1',
      '',
      null,
      1,
      20,
    ]
    queryClient.setQueryData(key, { retained: true })
    const { result } = renderHook(() => useCaseTeamCandidatesQuery(params), { wrapper })

    await waitFor(() =>
      expect(result.current.caseTeamCandidatesError).toBeInstanceOf(Error),
    )
    expect(response.throwError).toHaveBeenCalledOnce()
    expect(queryClient.getQueryData(key)).toEqual({ retained: true })
  })
})
