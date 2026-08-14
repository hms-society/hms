import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { consultationDocumentQueryKeys } from './consultation-document-query-keys'

export function useConsultationDocumentVersionQuery(
  consultationId?: string,
  documentId?: string,
  documentVersionId?: string,
) {
  const { consultationDocumentProductionService } = useRestContext()
  const isEnabled = Boolean(consultationId && documentId && documentVersionId)

  const query = useQuery({
    queryKey: consultationDocumentQueryKeys.version(
      consultationId ?? '',
      documentId ?? '',
      documentVersionId ?? '',
    ),
    queryFn: async function fetchConsultationDocumentVersion() {
      const response = await consultationDocumentProductionService.getDocumentVersion(
        consultationId as string,
        documentId as string,
        documentVersionId as string,
      )

      if (response.isFailure) response.throwError()

      return response.body
    },
    enabled: isEnabled,
    retry: false,
  })

  return {
    documentVersion: query.data,
    documentVersionError: query.error,
    isLoadingDocumentVersion: query.isLoading,
    isFetchingDocumentVersion: query.isFetching,
    isSuccess: query.isSuccess,
    refetch: query.refetch,
  }
}
