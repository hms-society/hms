import type { IntakeListQuery } from '@hms/core/intake/domain/structures'
import { useQueryStates } from 'nuqs'
import { useState } from 'react'

import { useNavigation } from '@/ui/shared/hooks/use-navigation'

import { INTAKE_SEARCH_PARAMS, type IntakeSearchParams } from './intakes-page-search'
import { useIntakeResponsiblesQuery, useIntakesQuery } from './use-intakes-query'

function toIntakeListQuery(params: IntakeSearchParams): IntakeListQuery {
  return {
    search: params.search ?? undefined,
    status: params.status ?? undefined,
    responsibleId: params.responsibleId ?? undefined,
    origin: params.origin ?? undefined,
    contactChannel: params.contactChannel ?? undefined,
    registeredFrom: params.registeredFrom ?? undefined,
    registeredTo: params.registeredTo ?? undefined,
    page: params.page,
    pageSize: params.pageSize,
  }
}

export function useIntakesPage() {
  const { navigateTo } = useNavigation()
  const [searchParams, setSearchParams] = useQueryStates(INTAKE_SEARCH_PARAMS, {
    history: 'push',
  })
  const [copiedIntakeId, setCopiedIntakeId] = useState<string>()
  const query = toIntakeListQuery(searchParams)
  const {
    intakesPage,
    intakesPageError,
    isLoadingIntakes,
    refetch: refetchIntakes,
  } = useIntakesQuery(query)
  const { isLoadingResponsibles, refetchResponsibles, responsibles, responsiblesError } =
    useIntakeResponsiblesQuery()

  const hasActiveFilters = Boolean(
    searchParams.search ||
      searchParams.status ||
      searchParams.responsibleId ||
      searchParams.origin ||
      searchParams.contactChannel ||
      searchParams.registeredFrom ||
      searchParams.registeredTo,
  )
  const page = intakesPage?.page ?? searchParams.page
  const totalPages = intakesPage?.totalPages ?? 0

  function handleUpdateSearch(patch: Partial<IntakeSearchParams>) {
    const filterChanged = Object.keys(patch).some(
      (key) => key !== 'page' && key !== 'pageSize',
    )
    const pageChanged = 'page' in patch || filterChanged || 'pageSize' in patch
    const nextParams: Partial<IntakeSearchParams> = pageChanged
      ? { page: 'page' in patch ? patch.page : 1 }
      : {}

    if ('pageSize' in patch) nextParams.pageSize = patch.pageSize
    if ('search' in patch) nextParams.search = patch.search
    if ('status' in patch) nextParams.status = patch.status
    if ('responsibleId' in patch) nextParams.responsibleId = patch.responsibleId
    if ('origin' in patch) nextParams.origin = patch.origin
    if ('contactChannel' in patch) nextParams.contactChannel = patch.contactChannel
    if ('registeredFrom' in patch) nextParams.registeredFrom = patch.registeredFrom
    if ('registeredTo' in patch) nextParams.registeredTo = patch.registeredTo

    return setSearchParams(nextParams)
  }

  async function handleClearFilters() {
    await setSearchParams({
      search: null,
      status: null,
      responsibleId: null,
      origin: null,
      contactChannel: null,
      registeredFrom: null,
      registeredTo: null,
      page: null,
      pageSize: null,
    })
    await navigateTo('intakes', {})
  }

  async function handleCopyIntakeId(displayId: string) {
    await navigator.clipboard.writeText(displayId)
    setCopiedIntakeId(displayId)
  }

  function handleRetry() {
    void refetchIntakes()
  }

  function handleRetryResponsibles() {
    void refetchResponsibles()
  }

  return {
    copiedIntakeId,
    hasActiveFilters,
    intakesPage,
    intakesPageError,
    isLoadingIntakes,
    isLoadingResponsibles,
    page,
    query,
    responsibles,
    responsiblesError,
    searchParams,
    totalPages,
    handleClearFilters,
    handleCopyIntakeId,
    handleRetry,
    handleRetryResponsibles,
    handleUpdateSearch,
  }
}

export type IntakesPageController = ReturnType<typeof useIntakesPage>
