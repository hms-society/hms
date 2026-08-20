import type {
  ContactChannel,
  IntakeListQuery,
  IntakeListStatus,
  IntakeOrigin,
} from '@hms/core/intake/domain/structures'
import { useQueryStates } from 'nuqs'
import { useMemo } from 'react'

import { INTAKE_SEARCH_PARAMS, type IntakeSearchParams } from './intakes-page-search'
import { useIntakeResponsiblesQuery } from '@/ui/intake/hooks/use-intake-responsibles-query'
import { useIntakesQuery } from './use-intakes-query'

function toQuery(params: IntakeSearchParams): IntakeListQuery {
  return {
    search: params.search.trim() || undefined,
    status: params.status ?? undefined,
    responsibleId: params.responsibleId ?? undefined,
    origin: params.origin ? (params.origin as IntakeOrigin) : undefined,
    contactChannel: params.contactChannel
      ? (params.contactChannel as ContactChannel)
      : undefined,
    registeredFrom: params.registeredFrom ?? undefined,
    registeredTo: params.registeredTo ?? undefined,
    page: params.page,
    pageSize: params.pageSize,
  }
}

export function useIntakesPage() {
  const [searchParams, setSearchParams] = useQueryStates(INTAKE_SEARCH_PARAMS, {
    history: 'push',
  })
  const query = useMemo(() => toQuery(searchParams), [searchParams])
  const intakes = useIntakesQuery(query)
  const responsibles = useIntakeResponsiblesQuery()

  function update(patch: Partial<IntakeSearchParams>) {
    const filterChanged = Object.keys(patch).some(
      (key) => !['page', 'pageSize'].includes(key),
    )

    return setSearchParams({
      ...patch,
      ...(filterChanged ? { page: 1 } : {}),
    })
  }

  function clear() {
    return setSearchParams({
      search: '',
      status: null,
      responsibleId: null,
      origin: null,
      contactChannel: null,
      registeredFrom: null,
      registeredTo: null,
      page: 1,
    })
  }

  const hasFilters = Boolean(
    searchParams.search ||
      searchParams.status ||
      searchParams.responsibleId ||
      searchParams.origin ||
      searchParams.contactChannel ||
      searchParams.registeredFrom ||
      searchParams.registeredTo,
  )

  return {
    searchParams,
    query,
    intakes,
    responsibles,
    hasFilters,
    page: intakes.data?.page ?? searchParams.page,
    totalPages: intakes.data?.totalPages ?? 0,
    update,
    clear,
  }
}

export type IntakesPageController = ReturnType<typeof useIntakesPage>

export type IntakeStatusTab = IntakeListStatus | 'all'
