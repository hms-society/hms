import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

const DOCUMENT_BATCHES_TRIAGE_QUERY_KEY = ['document-batches', 'triage'] as const

export function useDocumentBatchesTriageQuery() {
  const { documentEngineService } = useRestContext()
  const {
    data: batches = [],
    error: batchesError,
    isFetching: isFetchingBatches,
    refetch: refetchBatches,
  } = useQuery({
    queryKey: DOCUMENT_BATCHES_TRIAGE_QUERY_KEY,
    queryFn: async () => {
      const response = await documentEngineService.listTriageBatches()

      if (response.isFailure) response.throwError()

      return response.body
    },
  })

  return {
    batches,
    batchesError,
    isFetchingBatches,
    refetchBatches,
  }
}
