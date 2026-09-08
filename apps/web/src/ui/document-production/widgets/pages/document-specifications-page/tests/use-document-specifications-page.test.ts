import { act, renderHook } from '@testing-library/react'
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useDocumentCatalogQuery } from '@/ui/document-production/hooks/use-document-catalog-query'
import { useDocumentSpecificationsPage } from '../use-document-specifications-page'
import { useDocumentSpecificationsQuery } from '@/ui/document-production/hooks/use-document-specifications-query'
import { useDocumentTopicsQuery } from '@/ui/document-production/hooks/use-document-topics-query'

vi.mock('@/ui/document-production/hooks/use-document-catalog-query', () => ({
  useDocumentCatalogQuery: vi.fn(),
}))
vi.mock('@/ui/document-production/hooks/use-document-specifications-query', () => ({
  useDocumentSpecificationsQuery: vi.fn(),
}))
vi.mock('@/ui/document-production/hooks/use-document-topics-query', () => ({
  useDocumentTopicsQuery: vi.fn(),
}))

const useDocumentCatalogQueryMock = vi.mocked(useDocumentCatalogQuery)
const useDocumentSpecificationsQueryMock = vi.mocked(useDocumentSpecificationsQuery)
const useDocumentTopicsQueryMock = vi.mocked(useDocumentTopicsQuery)

function createSpecificationsResult() {
  return {
    data: {
      items: [],
      page: 2,
      pageSize: 10,
      total: 20,
      totalPages: 2,
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }
}

describe('useDocumentSpecificationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useDocumentSpecificationsQueryMock.mockReturnValue(
      createSpecificationsResult() as never,
    )
    useDocumentCatalogQueryMock.mockReturnValue({
      areas: { data: [], isLoading: false, isError: false },
    } as never)
    useDocumentTopicsQueryMock.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as never)
  })

  it('maps URL state to the document specifications query', () => {
    const { result } = renderHook(() => useDocumentSpecificationsPage(), {
      wrapper: withNuqsTestingAdapter({
        searchParams:
          '?search=  Contrato  &legalAreaId=area-id&legalTopicId=topic-id&moment=formalization&status=available&page=2&pageSize=10',
      }),
    })

    expect(result.current.query).toEqual({
      search: 'Contrato',
      legalAreaId: 'area-id',
      legalTopicId: 'topic-id',
      moment: 'formalization',
      status: 'available',
      page: 2,
      pageSize: 10,
    })
    expect(useDocumentSpecificationsQueryMock).toHaveBeenCalledWith(result.current.query)
    expect(useDocumentTopicsQueryMock).toHaveBeenCalledWith('area-id')
    expect(result.current.page).toBe(2)
    expect(result.current.totalPages).toBe(2)
  })

  it('resets pagination and clears the selected topic when the area changes', async () => {
    const { result } = renderHook(() => useDocumentSpecificationsPage(), {
      wrapper: withNuqsTestingAdapter({
        searchParams: '?legalAreaId=area-id&legalTopicId=topic-id&page=3&pageSize=10',
      }),
    })

    await act(async () => {
      await result.current.update({ status: 'available' })
    })

    expect(result.current.query).toMatchObject({
      legalAreaId: 'area-id',
      legalTopicId: 'topic-id',
      status: 'available',
      page: 1,
      pageSize: 10,
    })

    await act(async () => {
      await result.current.updateArea('new-area-id')
    })

    expect(result.current.query).toMatchObject({
      legalAreaId: 'new-area-id',
      legalTopicId: undefined,
      page: 1,
      pageSize: 10,
    })
  })

  it('clears all filters and reports whether the query is filtered', async () => {
    const { result } = renderHook(() => useDocumentSpecificationsPage(), {
      wrapper: withNuqsTestingAdapter({ searchParams: '?search=Contrato&page=2' }),
    })

    expect(result.current.hasFilters).toBe(true)

    await act(async () => {
      await result.current.clear()
    })

    expect(result.current.hasFilters).toBe(false)
    expect(result.current.query).toEqual({
      search: undefined,
      legalAreaId: undefined,
      legalTopicId: undefined,
      moment: undefined,
      status: undefined,
      page: 1,
      pageSize: 20,
    })
  })
})
