import { useQuery } from '@tanstack/react-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useDocumentCatalogQuery() {
  const { legalCatalogService } = useRestContext()
  const areas = useQuery({
    queryKey: ['legal-catalog', 'areas'],
    queryFn: async () => {
      const response = await legalCatalogService.listLegalAreas()
      if (response.isFailure) response.throwError()
      return response.body
    },
    staleTime: 5 * 60 * 1000,
  })
  return { areas }
}
