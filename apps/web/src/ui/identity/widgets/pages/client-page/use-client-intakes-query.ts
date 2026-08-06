import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const useClientIntakesQuery = (clientId?: string) => {
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

      if (response.isFailure) response.throwError()

      return response.body
    },
    enabled: !!clientId,
  })

  return { clientIntakes, clientIntakesError, isLoadingClientIntakes }
}
