import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { createQueryHookTestWrapper } from './query-hook-test-utils'
import { useAdminCasesQuery } from '../use-admin-cases-query'

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({ useRestContext: vi.fn() }))

const restContextMock = vi.mocked(useRestContext)
const caseManagementService = { listAllCasesForAdmin: vi.fn() }
const query = { page: 2, pageSize: 20, search: 'contrato' }

function failure(statusCode: number) {
  const throwError = vi.fn(() => {
    throw new Error(`Request failed with ${statusCode}`)
  })
  return { isFailure: true, statusCode, throwError }
}

describe('useAdminCasesQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    restContextMock.mockReturnValue({ caseManagementService } as never)
  })

  afterEach(() => vi.restoreAllMocks())

  it('loads the requested admin cases and caches them by query parameters', async () => {
    const cases = { items: [{ id: 'case-1' }], total: 1, page: 2, totalPages: 1 }
    caseManagementService.listAllCasesForAdmin.mockResolvedValue({
      isFailure: false,
      body: cases,
    })
    const { wrapper, queryClient } = createQueryHookTestWrapper()
    const { result } = renderHook(() => useAdminCasesQuery(query), { wrapper })

    await waitFor(() => expect(result.current.data).toEqual(cases))
    expect(caseManagementService.listAllCasesForAdmin).toHaveBeenCalledWith(query)
    expect(
      queryClient.getQueryCache().find({
        queryKey: ['case-management', 'admin-cases', 'contrato', 2, 20],
      }),
    ).toBeDefined()
    expect(result.current.isError).toBe(false)
  })

  it('removes cached admin case queries when access is forbidden', async () => {
    const response = failure(403)
    caseManagementService.listAllCasesForAdmin.mockResolvedValue(response)
    const { wrapper, queryClient } = createQueryHookTestWrapper()
    queryClient.setQueryData(['case-management', 'admin-cases', 'cached', 1, 20], {
      protected: true,
    })
    queryClient.setQueryData(['case-management', 'my-cases'], { retained: true })
    renderHook(() => useAdminCasesQuery(query), { wrapper })

    await waitFor(() => expect(response.throwError).toHaveBeenCalledOnce())
    await waitFor(() =>
      expect(
        queryClient.getQueryData(['case-management', 'admin-cases', 'cached', 1, 20]),
      ).toBeUndefined(),
    )
    expect(response.throwError).toHaveBeenCalledOnce()
    expect(queryClient.getQueryData(['case-management', 'my-cases'])).toEqual({
      retained: true,
    })
  })

  it('keeps cached admin cases for other failures', async () => {
    const response = failure(500)
    caseManagementService.listAllCasesForAdmin.mockResolvedValue(response)
    const { wrapper, queryClient } = createQueryHookTestWrapper()
    const cached = { protected: true }
    const cachedKey = ['case-management', 'admin-cases', 'cached', 1, 20]
    queryClient.setQueryData(cachedKey, cached)
    const { result } = renderHook(() => useAdminCasesQuery(query), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(response.throwError).toHaveBeenCalledOnce()
    expect(queryClient.getQueryData(cachedKey)).toEqual(cached)
  })
})
