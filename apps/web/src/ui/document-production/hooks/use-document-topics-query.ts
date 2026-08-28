import { useQueries } from '@tanstack/react-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useDocumentTopicsQuery(legalAreaId: string | null | readonly string[]) {
  const { legalCatalogService } = useRestContext()
  const areaIds = Array.isArray(legalAreaId)
    ? [...new Set(legalAreaId)]
    : legalAreaId
      ? [legalAreaId]
      : []
  const queries = useQueries({
    queries: areaIds.map((areaId) => ({
      queryKey: ['legal-catalog', 'topics', areaId],
      queryFn: async () => {
        const response = await legalCatalogService.listLegalTopics(areaId)
        if (response.isFailure) response.throwError()
        return response.body
      },
      staleTime: 5 * 60 * 1000,
    })),
  })
  return {
    data: queries.flatMap((query) => query.data ?? []),
    isLoading: queries.some((query) => query.isLoading),
    isError: queries.some((query) => query.isError),
    refetch: () => Promise.all(queries.map((query) => query.refetch())),
  }
}
