import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function getFormalizationQueryKey(formalizationId: string) {
  return ['formalization', 'detail', formalizationId] as const
}

type FormalizationQueryError = Error & { statusCode?: number }

function throwResponseError(response: {
  readonly statusCode: number
  readonly throwError: () => never
}): never {
  try {
    response.throwError()
  } catch (error) {
    if (error instanceof Error) {
      Object.assign(error as FormalizationQueryError, {
        statusCode: response.statusCode,
      })
    }

    throw error
  }
}

export function useFormalizationQuery(formalizationId: string) {
  const { formalizationService } = useRestContext()

  const query = useQuery({
    queryKey: getFormalizationQueryKey(formalizationId),
    queryFn: async function getFormalization() {
      const response = await formalizationService.get(formalizationId)
      if (response.isFailure) throwResponseError(response)
      return response.body
    },
    retry: false,
  })

  return {
    ...query,
    data: query.data,
    error: query.error,
    formalizationDetails: query.data,
    formalizationDetailsError: query.error,
    isErrorFormalizationDetails: query.isError,
    isFetchingFormalizationDetails: query.isFetching,
    isLoadingFormalizationDetails: query.isLoading,
  }
}
