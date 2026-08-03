import { useQuery } from '@tanstack/react-query'

import type { IntakeListQuery } from '@hms/core/intake/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useIntakesQuery(query: IntakeListQuery) {
  const { intakeService } = useRestContext()

  async function fetchIntakes() {
    const response = await intakeService.listIntakes(query)

    if (response.isFailure) response.throwError()

    return response.body
  }

  const {
    data: intakesPage = null,
    error: intakesPageError,
    isLoading: isLoadingIntakes,
    refetch,
  } = useQuery({
    queryKey: ['intakes', query],
    queryFn: fetchIntakes,
    retry: false,
  })

  return {
    intakesPage,
    intakesPageError,
    isLoadingIntakes,
    refetch,
  }
}

export function useIntakeResponsiblesQuery() {
  const { intakeService } = useRestContext()

  async function fetchIntakeResponsibles() {
    const response = await intakeService.listIntakeResponsibles()

    if (response.isFailure) response.throwError()

    return response.body
  }

  const {
    data: responsibles = [],
    error: responsiblesError,
    isLoading: isLoadingResponsibles,
    refetch: refetchResponsibles,
  } = useQuery({
    queryKey: ['intakes', 'responsibles'],
    queryFn: fetchIntakeResponsibles,
    staleTime: 5 * 60 * 1000,
  })

  return {
    isLoadingResponsibles,
    refetchResponsibles,
    responsibles,
    responsiblesError,
  }
}
