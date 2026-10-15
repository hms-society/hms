import { useQuery } from '@tanstack/react-query'
import { DocumentValidationStatus } from '@hms/core/document-engine/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useDocumentValidationDocumentQuery(documentFileId: string) {
  const { documentValidationService } = useRestContext()
  const {
    data: document,
    error: documentError,
    isLoading: isLoadingDocument,
  } = useQuery({
    queryKey: ['document-validation', 'documents', documentFileId],
    queryFn: async () => {
      const response = await documentValidationService.getDocument(documentFileId)

      if (response.isFailure) response.throwError()

      return response.body
    },
    enabled: Boolean(documentFileId),
    refetchInterval: (query) =>
      query.state.data?.status === DocumentValidationStatus.Processing ? 1000 : false,
  })

  return { document, documentError, isLoadingDocument }
}
