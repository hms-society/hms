import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useDocumentBatchesTriageQuery(params?: {
  page?: number
  limit?: number
}) {
  const { documentService } = useRestContext()
  const page = params?.page ?? 1
  const limit = params?.limit ?? 6

  const {
    data: triageData = { items: [], total: 0, page, limit },
    error: batchesError,
    isFetching: isFetchingBatches,
    refetch: refetchBatches,
  } = useQuery({
    queryKey: ['document-batches', 'triage', page, limit] as const,
    queryFn: async () => {
      const response = await documentService.listTriageBatches({ page, limit })

      if (response.isFailure) response.throwError()

      return response.body
    },
  })

  return {
    batches: triageData.items,
    total: triageData.total,
    page: triageData.page,
    limit: triageData.limit,
    batchesError,
    isFetchingBatches,
    refetchBatches,
  }
}
