import { act, renderHook } from '@testing-library/react'
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useIntakeResponsiblesQuery } from '@/ui/intake/hooks/use-intake-responsibles-query'
import { useIntakesPage } from '../use-intakes-page'
import { useIntakesQuery } from '@/ui/intake/hooks/use-intakes-query'

vi.mock('@/ui/intake/hooks/use-intakes-query', () => ({
  useIntakesQuery: vi.fn(),
}))
vi.mock('@/ui/intake/hooks/use-intake-responsibles-query', () => ({
  useIntakeResponsiblesQuery: vi.fn(),
}))

const useIntakesQueryMock = vi.mocked(useIntakesQuery)
const useIntakeResponsiblesQueryMock = vi.mocked(useIntakeResponsiblesQuery)

describe('useIntakesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useIntakesQueryMock.mockReturnValue({
      data: { items: [], page: 2, pageSize: 10, total: 20, totalPages: 2 },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never)
    useIntakeResponsiblesQueryMock.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as never)
  })

  it('maps URL filters to the list query', () => {
    const { result } = renderHook(() => useIntakesPage(), {
      wrapper: withNuqsTestingAdapter({
        searchParams:
          '?search=  Ana  &status=consultation_scheduled&responsibleId=responsible-1&origin=direct&contactChannel=whatsapp&registeredFrom=2026-08-01&registeredTo=2026-08-31&page=2&pageSize=10',
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
    expect(useIntakesQueryMock).toHaveBeenCalledWith(result.current.query)
    expect(result.current.page).toBe(2)
    expect(result.current.totalPages).toBe(2)
  })

  it('resets pagination when a filter changes', async () => {
    const { result } = renderHook(() => useIntakesPage(), {
      wrapper: withNuqsTestingAdapter({ searchParams: '?page=3&pageSize=10' }),
    })

    await act(async () => {
      await result.current.update({ status: 'contracted' })
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
      await result.current.clear()
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
