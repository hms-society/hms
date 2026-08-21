import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useClientDetailsQuery(clientId?: string) {
  const { identityService } = useRestContext()
  const {
    data: clientDetails,
    error: clientDetailsError,
    isLoading: isLoadingClientDetails,
  } = useQuery({
    queryKey: ['identity', 'client', clientId],
    queryFn: async () => {
      if (!clientId) throw new Error('Client ID is required')
      const response = await identityService.getClient(clientId)
      if (response.isFailure) response.throwError()

      return response.body
    },
    enabled: !!clientId,
  })

  return { clientDetails, clientDetailsError, isLoadingClientDetails }
}
