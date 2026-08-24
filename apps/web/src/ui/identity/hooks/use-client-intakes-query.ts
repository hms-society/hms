import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export type ClientIntakesQueryOptions = {
  enabled?: boolean
  throwOnFailure?: boolean
}

export function useClientIntakesQuery(
  clientId?: string,
  options: ClientIntakesQueryOptions = {},
) {
  const { intakeService } = useRestContext()
  const {
    data: clientIntakes = [],
    error: clientIntakesError,
    isLoading: isLoadingClientIntakes,
  } = useQuery({
    queryKey: ['intakes', 'client', clientId],
    queryFn: async () => {
      if (!clientId) return []
      const response = await intakeService.listClientIntake(clientId)

      if (response.isFailure) {
        if (options.throwOnFailure !== false) response.throwError()
        return []
      }

      return response.body
    },
    enabled: options.enabled ?? !!clientId,
  })

  return { clientIntakes, clientIntakesError, isLoadingClientIntakes }
}
