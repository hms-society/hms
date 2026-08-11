import { useQuery } from '@tanstack/react-query'
import { useRestContext } from './use-rest-context'

export const useClientDocumentsQuery = (clientId: string) => {
  const { documentService } = useRestContext()

  return useQuery({
    queryKey: ['document-batches', 'client', clientId],
    queryFn: async () => {
      const response: any = await documentService.listClientDocument(clientId)

      if (Array.isArray(response)) return response
      if (response?.body && Array.isArray(response.body)) return response.body
      if (response?.data && Array.isArray(response.data)) return response.data
      if (response?.isFailture) response.throwError()

      return []
    },
    enabled: !!clientId,
  })
}
