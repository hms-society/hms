import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useLegalTopicsForAdministrationQuery(legalAreaId: string | undefined) {
  const { legalCatalogService } = useRestContext()
  return useQuery({
    queryKey: ['legal-catalog', 'topics', 'administration', legalAreaId],
    queryFn: async () => {
      if (!legalAreaId) return []
      const response = await legalCatalogService.listLegalTopics(legalAreaId)
      if (response.isFailure) response.throwError()
      return response.body
    },
    enabled: Boolean(legalAreaId),
    retry: false,
  })
}
