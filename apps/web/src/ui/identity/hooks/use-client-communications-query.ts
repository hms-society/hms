import { useQuery } from '@tanstack/react-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const useClientCommunicationsQuery = (clientId: string) => {
  const { communicationService } = useRestContext()

  return useQuery({
    queryKey: ['communications', 'client', clientId],
    queryFn: async () => {
      const response: any = await communicationService.listClientCommunications(clientId)

      let communications: any[] = []
      if (Array.isArray(response)) {
        communications = response
      } else if (response?.body && Array.isArray(response.body)) {
        communications = response.body
      } else if (response?.data && Array.isArray(response.data)) {
        communications = response.data
      } else if (response?.isFailure) {
        response.throwError()
      }

      return communications
    },
    enabled: !!clientId,
    refetchInterval: 1000,
  })
}
