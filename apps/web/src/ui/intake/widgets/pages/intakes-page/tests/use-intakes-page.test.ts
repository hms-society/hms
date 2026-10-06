import { act, renderHook } from '@testing-library/react'
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useIntakeResponsiblesQuery } from '@/ui/intake/hooks/use-intake-responsibles-query'
import { useIntakesListQuery } from '@/ui/intake/hooks/use-intakes-list-query'
import { useIntakesPage } from '../use-intakes-page'

vi.mock('@/ui/intake/hooks/use-intakes-list-query', () => ({
  useIntakesListQuery: vi.fn(() => ({
    data: { items: [], page: 2, pageSize: 10, total: 20, totalPages: 2 },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  })),
}))
vi.mock('@/ui/intake/hooks/use-intake-responsibles-query', () => ({
  useIntakeResponsiblesQuery: vi.fn(),
}))

const useIntakesListQueryMock = vi.mocked(useIntakesListQuery)
const useIntakeResponsiblesQueryMock = vi.mocked(useIntakeResponsiblesQuery)

describe('useIntakesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useIntakeResponsiblesQueryMock.mockReturnValue({ data: [] } as never)
  })

  it('maps URL filters to the intake list query', () => {
    const { result } = renderHook(() => useIntakesPage(), {
      wrapper: withNuqsTestingAdapter({
        searchParams:
          '?search=++Ana++&status=consultation_scheduled&responsibleId=responsible-1&origin=direct&contactChannel=whatsapp&registeredFrom=2026-08-01&registeredTo=2026-08-31&page=2&pageSize=10',
      }),
    })

    expect(result.current.query).toEqual({
      search: 'Ana',
      status: 'consultation_scheduled',
      responsibleId: 'responsible-1',
      origin: 'direct',
      contactChannel: 'whatsapp',
      registeredFrom: '2026-08-01',
      registeredTo: '2026-08-31',
      page: 2,
      pageSize: 10,
    })
    expect(useIntakesListQueryMock).toHaveBeenCalledWith(result.current.query)
    expect(result.current.page).toBe(2)
    expect(result.current.totalPages).toBe(2)
    expect(result.current.responsibles).toEqual({ data: [] })
  })

  it('normalizes malformed URL filters before they reach the intake list query', () => {
    const { result } = renderHook(() => useIntakesPage(), {
      wrapper: withNuqsTestingAdapter({
        searchParams:
          '?search=++Ana++&status=invalid&responsibleId=++&origin=unknown&contactChannel=emailish&registeredFrom=2026-02-30&registeredTo=2026-08-31&page=0&pageSize=101',
      }),
    })

    expect(result.current.query).toEqual({
      search: 'Ana',
      status: undefined,
      responsibleId: undefined,
      origin: undefined,
      contactChannel: undefined,
      registeredFrom: undefined,
      registeredTo: '2026-08-31',
      page: 1,
      pageSize: 20,
    })
    expect(useIntakesListQueryMock).toHaveBeenCalledWith(result.current.query)
  })

  it('trims valid origin and contact channel URL filters before querying', () => {
    const { result } = renderHook(() => useIntakesPage(), {
      wrapper: withNuqsTestingAdapter({
        searchParams: '?origin=++direct++&contactChannel=++whatsapp++',
      }),
    })

    expect(result.current.query).toMatchObject({
      origin: 'direct',
      contactChannel: 'whatsapp',
    })
    expect(useIntakesListQueryMock).toHaveBeenCalledWith(result.current.query)
  })

  it('resets pagination when a filter changes', async () => {
    const { result } = renderHook(() => useIntakesPage(), {
      wrapper: withNuqsTestingAdapter({ searchParams: '?page=3&pageSize=10' }),
    })

    await act(async () => {
      await result.current.updateSearchParams({ status: 'contracted' })
    })

    expect(result.current.query).toMatchObject({
      status: 'contracted',
      page: 1,
      pageSize: 10,
    })
  })

  it('clears all filters and restores the first page', async () => {
    const { result } = renderHook(() => useIntakesPage(), {
      wrapper: withNuqsTestingAdapter({
        searchParams: '?search=Ana&origin=direct&page=3',
      }),
    })

    expect(result.current.hasFilters).toBe(true)

    await act(async () => {
      await result.current.clearSearchParams()
    })

    expect(result.current.hasFilters).toBe(false)
    expect(result.current.query).toEqual({
      search: undefined,
      status: undefined,
      responsibleId: undefined,
      origin: undefined,
      contactChannel: undefined,
      registeredFrom: undefined,
      registeredTo: undefined,
      page: 1,
      pageSize: 20,
    })
  })
})
