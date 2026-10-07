import type {
  ContactChannel,
  IntakeListQuery,
  IntakeListStatus,
  IntakeOrigin,
} from '@hms/core/intake/domain/structures'
import { useMemo } from 'react'
import { useQueryStates } from 'nuqs'

import { INTAKE_SEARCH_PARAMS, type IntakeSearchParams } from './intakes-query-search'
import { useIntakesListQuery } from './use-intakes-list-query'

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

export function useIntakesQuery() {
  const [searchParams, setSearchParams] = useQueryStates(INTAKE_SEARCH_PARAMS, {
    history: 'push',
  })
  const query = useMemo(() => toQuery(searchParams), [searchParams])
  const intakes = useIntakesListQuery(query)

  function updateSearchParams(patch: Partial<IntakeSearchParams>) {
    const filterChanged = Object.keys(patch).some(
      (key) => !['page', 'pageSize'].includes(key),
    )

    return setSearchParams({
      ...patch,
      ...(filterChanged ? { page: 1 } : {}),
    })
  }

  function clearSearchParams() {
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
    hasFilters,
    page: intakes.data?.page ?? searchParams.page,
    totalPages: intakes.data?.totalPages ?? 0,
    updateSearchParams,
    clearSearchParams,
  }
}

export type IntakeStatusTab = IntakeListStatus | 'all'
