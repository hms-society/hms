import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RestResponse } from '@hms/core/shared/responses/rest-response'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { useLegalAreasQuery } from '../use-legal-areas-query'
import { useLegalTopicsQuery } from '../use-legal-topics-query'

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: vi.fn(),
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
  })

  function createWrapper() {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    return function QueryProvider({ children }: PropsWithChildren) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    }
  }

  it('loads legal areas through the catalog service', async () => {
    const areas = [{ id: 'area-id', name: 'Cível' }]
    legalCatalogService.listLegalAreas.mockResolvedValue(
      new RestResponse({ body: areas }),
    )

    const { result } = renderHook(() => useLegalAreasQuery(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.legalAreas).toEqual(areas))
    expect(legalCatalogService.listLegalAreas).toHaveBeenCalledOnce()
  })

  it('loads topics for the selected legal area', async () => {
    const topics = [{ id: 'topic-id', name: 'Contratos' }]
    legalCatalogService.listLegalTopics.mockResolvedValue(
      new RestResponse({ body: topics }),
    )

    const { result } = renderHook(() => useLegalTopicsQuery('area-id'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.legalTopics).toEqual(topics))
    expect(legalCatalogService.listLegalTopics).toHaveBeenCalledWith('area-id')
  })

  it('does not load topics without a selected legal area', () => {
    renderHook(() => useLegalTopicsQuery(''), { wrapper: createWrapper() })

    expect(legalCatalogService.listLegalTopics).not.toHaveBeenCalled()
  })

  it('exposes service failures as query errors', async () => {
    legalCatalogService.listLegalAreas.mockResolvedValue(
      new RestResponse({ statusCode: 500, errorMessage: 'temporary failure' }),
    )

    const { result } = renderHook(() => useLegalAreasQuery(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.legalAreasError).toBeInstanceOf(Error))
  })
})
