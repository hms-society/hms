import { act, renderHook } from '@testing-library/react'
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ContactChannel,
  IntakeListStatus,
  IntakeOrigin,
} from '@hms/core/intake/domain/structures'

import { useIntakeResponsiblesQuery, useIntakesQuery } from '../use-intakes-query'
import { useIntakesPage } from '../use-intakes-page'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

vi.mock('../use-intakes-query', () => ({
  useIntakeResponsiblesQuery: vi.fn(),
  useIntakesQuery: vi.fn(),
}))
vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: vi.fn(),
}))

const useIntakeResponsiblesQueryMock = vi.mocked(useIntakeResponsiblesQuery)
const useIntakesQueryMock = vi.mocked(useIntakesQuery)
const useNavigationMock = vi.mocked(useNavigation)

const responsible = { responsibleId: 'responsible-1', professionalName: 'Ana Ribeiro' }

function createIntakesPageResult(
  overrides: Partial<ReturnType<typeof useIntakesQuery>> = {},
) {
  return {
    intakesPage: null,
    intakesPageError: null,
    isLoadingIntakes: false,
    refetch: vi.fn(),
    ...overrides,
  }
}

function createResponsiblesResult(
  overrides: Partial<ReturnType<typeof useIntakeResponsiblesQuery>> = {},
) {
  return {
    isLoadingResponsibles: false,
    refetchResponsibles: vi.fn(),
    responsibles: [responsible],
    responsiblesError: null,
    ...overrides,
  }
}

describe('useIntakesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useNavigationMock.mockReturnValue({
      navigateTo: vi.fn().mockResolvedValue(undefined),
      navigateCollaboratorsSearch: vi.fn(),
    })
    useIntakesQueryMock.mockReturnValue(createIntakesPageResult())
    useIntakeResponsiblesQueryMock.mockReturnValue(createResponsiblesResult())
  })

  it('maps URL filters to the intake list query', () => {
    const { result } = renderHook(() => useIntakesPage(), {
      wrapper: withNuqsTestingAdapter({
        searchParams:
          '?search=  intake-42  &status=consultation_scheduled&responsibleId=responsible-1&origin=referral&contactChannel=email&registeredFrom=2026-07-01&registeredTo=2026-07-31&page=2&pageSize=10',
      }),
    })

    expect(result.current.query).toEqual({
      search: 'intake-42',
      status: IntakeListStatus.ConsultationScheduled,
      responsibleId: 'responsible-1',
      origin: IntakeOrigin.Referral,
      contactChannel: ContactChannel.Email,
      registeredFrom: '2026-07-01',
      registeredTo: '2026-07-31',
      page: 2,
      pageSize: 10,
    })
  })

  it('updates filters in the URL and resets pagination', async () => {
    const { result } = renderHook(() => useIntakesPage(), {
      wrapper: withNuqsTestingAdapter({ searchParams: '?search=Ana&page=3&pageSize=10' }),
    })

    await act(async () => {
      await result.current.handleUpdateSearch({
        responsibleId: responsible.responsibleId,
        status: IntakeListStatus.Contracted,
      })
    })

    expect(result.current.query).toMatchObject({
      responsibleId: responsible.responsibleId,
      status: IntakeListStatus.Contracted,
      page: 1,
      pageSize: 10,
    })

    await act(async () => {
      await result.current.handleClearFilters()
    })

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
    expect(useNavigationMock.mock.results[0]?.value.navigateTo).toHaveBeenCalledWith(
      'intakes',
      {},
    )
  })

  it('preserves the query while retrying list and responsible requests', () => {
    const refetch = vi.fn()
    const refetchResponsibles = vi.fn()
    useIntakesQueryMock.mockReturnValue(createIntakesPageResult({ refetch }))
    useIntakeResponsiblesQueryMock.mockReturnValue(
      createResponsiblesResult({ refetchResponsibles }),
    )
    const { result } = renderHook(() => useIntakesPage(), {
      wrapper: withNuqsTestingAdapter({ searchParams: '?search=Ana&page=2' }),
    })

    act(() => result.current.handleRetry())
    act(() => result.current.handleRetryResponsibles())

    expect(refetch).toHaveBeenCalledOnce()
    expect(refetchResponsibles).toHaveBeenCalledOnce()
    expect(result.current.searchParams.search).toBe('Ana')
    expect(result.current.searchParams.page).toBe(2)
  })

  it('reports active filters and copies the display identifier', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    const { result } = renderHook(() => useIntakesPage(), {
      wrapper: withNuqsTestingAdapter({ searchParams: '?origin=website' }),
    })

    await act(async () => {
      await result.current.handleCopyIntakeId('INT-00042')
    })

    expect(result.current.hasActiveFilters).toBe(true)
    expect(writeText).toHaveBeenCalledWith('INT-00042')
    expect(result.current.copiedIntakeId).toBe('INT-00042')
  })
})
