import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { MAX_FILTER_OPTION_PAGES } from '@/ui/scheduling/hooks/use-calendar-filter-options'
import { useClientFilterDialog } from '../use-client-filter-dialog'

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: vi.fn(),
}))

const useRestContextMock = vi.mocked(useRestContext)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: PropsWithChildren) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useClientFilterDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('continues from an empty intermediate page until a visible option is found', async () => {
    const listCalendarFilterOptions = vi
      .fn()
      .mockResolvedValueOnce({
        isFailure: false,
        statusCode: 200,
        errorMessage: '',
        body: { items: [], nextCursor: 'cursor-1' },
      })
      .mockResolvedValueOnce({
        isFailure: false,
        statusCode: 200,
        errorMessage: '',
        body: { items: [{ id: 'client-1', name: 'Mariana Costa' }] },
      })
    useRestContextMock.mockReturnValue({
      schedulingService: { listCalendarFilterOptions },
    } as never)

    const { result } = renderHook(() => useClientFilterDialog(true, undefined, vi.fn()), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.options).toHaveLength(1))
    expect(listCalendarFilterOptions).toHaveBeenNthCalledWith(
      2,
      'client',
      undefined,
      'cursor-1',
    )
    expect(result.current.isScanLimitReached).toBe(false)
  })

  it('stops automatic scanning at the bounded page budget', async () => {
    const listCalendarFilterOptions = vi
      .fn()
      .mockImplementation((_kind, _search, cursor) =>
        Promise.resolve({
          isFailure: false,
          statusCode: 200,
          errorMessage: '',
          body: {
            items: [],
            nextCursor: cursor
              ? `cursor-${Number(cursor.split('-')[1]) + 1}`
              : 'cursor-1',
          },
        }),
      )
    useRestContextMock.mockReturnValue({
      schedulingService: { listCalendarFilterOptions },
    } as never)

    const { result } = renderHook(() => useClientFilterDialog(true, undefined, vi.fn()), {
      wrapper: createWrapper(),
    })

    await waitFor(() =>
      expect(listCalendarFilterOptions).toHaveBeenCalledTimes(MAX_FILTER_OPTION_PAGES),
    )
    expect(result.current.isScanLimitReached).toBe(true)
    expect(result.current.options).toEqual([])
  })
})
