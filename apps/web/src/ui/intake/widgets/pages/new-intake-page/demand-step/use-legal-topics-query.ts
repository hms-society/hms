import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const useLegalTopicsQuery = (legalAreaId: string) => {
  const { legalCatalogService } = useRestContext()
  const {
    data: legalTopics = [],
    error: legalTopicsError,
    isLoading: isLoadingLegalTopics,
  } = useQuery({
    queryKey: ['legal-catalog', 'topics', legalAreaId],
    queryFn: async () => {
      const response = await legalCatalogService.listLegalTopics(legalAreaId)

      if (response.isFailure) response.throwError()

      return response.body
    },
    enabled: Boolean(legalAreaId),
  })

  return { legalTopics, legalTopicsError, isLoadingLegalTopics }
}
