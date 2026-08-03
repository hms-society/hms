import { useQuery } from '@tanstack/react-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const useClientCommunicationsQuery = (clientId: string) => {
  const { communicationService } = useRestContext()

  return useQuery({
    queryKey: ['communications', 'client', clientId],
    queryFn: async () => {
      const response: any = await communicationService.listClientCommunications(clientId)

      if (Array.isArray(response)) return response
      if (response?.body && Array.isArray(response.body)) return response.body
      if (response?.data && Array.isArray(response.data)) return response.data

      if (response?.isFailure) response.throwError()

      return []
    },
    enabled: !!clientId,
  })
}
