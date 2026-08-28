import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RestResponse } from '@hms/core/shared/responses/rest-response'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { useLegalAreasQuery } from '../use-legal-areas-query'
import { useLegalTopicsQuery } from '../use-legal-topics-query'

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: vi.fn(),
}))

const { useQueryMock } = vi.hoisted(() => ({ useQueryMock: vi.fn() }))

vi.mock('@tanstack/react-query', () => ({
  useQuery: useQueryMock,
}))

const useRestContextMock = vi.mocked(useRestContext)

describe('legal catalog query hooks', () => {
  const legalCatalogService = {
    listLegalAreas: vi.fn(),
    listLegalTopics: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useRestContextMock.mockReturnValue({ legalCatalogService } as never)
    useQueryMock.mockReturnValue({
      data: undefined,
      error: null,
      isLoading: false,
    })
  })

  it('loads legal areas through the catalog service', async () => {
    const areas = [{ id: 'area-id', name: 'Cível' }]
    legalCatalogService.listLegalAreas.mockResolvedValue(
      new RestResponse({ body: areas }),
    )
    useQueryMock.mockReturnValue({ data: areas, error: null, isLoading: false })

    const { result } = renderHook(() => useLegalAreasQuery())
    const queryOptions = useQueryMock.mock.calls[0]?.[0]

    expect(result.current.legalAreas).toEqual(areas)
    await expect(queryOptions.queryFn()).resolves.toEqual(areas)
    expect(legalCatalogService.listLegalAreas).toHaveBeenCalledOnce()
  })

  it('loads topics for the selected legal area', async () => {
    const topics = [{ id: 'topic-id', name: 'Contratos' }]
    legalCatalogService.listLegalTopics.mockResolvedValue(
      new RestResponse({ body: topics }),
    )
    useQueryMock.mockReturnValue({ data: topics, error: null, isLoading: false })

    const { result } = renderHook(() => useLegalTopicsQuery('area-id'))
    const queryOptions = useQueryMock.mock.calls[0]?.[0]

    expect(result.current.legalTopics).toEqual(topics)
    await expect(queryOptions.queryFn()).resolves.toEqual(topics)
    expect(legalCatalogService.listLegalTopics).toHaveBeenCalledWith('area-id')
  })

  it('does not load topics without a selected legal area', () => {
    renderHook(() => useLegalTopicsQuery(''))

    expect(useQueryMock.mock.calls[0]?.[0].enabled).toBe(false)
    expect(legalCatalogService.listLegalTopics).not.toHaveBeenCalled()
  })

  it('exposes service failures as query errors', async () => {
    legalCatalogService.listLegalAreas.mockResolvedValue(
      new RestResponse({ statusCode: 500, errorMessage: 'temporary failure' }),
    )

    renderHook(() => useLegalAreasQuery())
    const queryOptions = useQueryMock.mock.calls[0]?.[0]

    await expect(queryOptions.queryFn()).rejects.toBeInstanceOf(Error)
  })
})
