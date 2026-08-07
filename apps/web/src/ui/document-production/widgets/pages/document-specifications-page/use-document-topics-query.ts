import { useQuery } from '@tanstack/react-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useDocumentTopicsQuery(legalAreaId: string | null) {
  const { legalCatalogService } = useRestContext()
  return useQuery({
    queryKey: ['legal-catalog', 'topics', legalAreaId],
    enabled: Boolean(legalAreaId),
    queryFn: async () => {
      const response = await legalCatalogService.listLegalTopics(legalAreaId as string)
      if (response.isFailure) response.throwError()
      return response.body
    },
    staleTime: 5 * 60 * 1000,
  })
}
