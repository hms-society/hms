import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

const DOCUMENT_VALIDATION_DOCUMENTS_QUERY_KEY = [
  'document-validation',
  'documents',
] as const

export function useDocumentValidationDocumentsQuery() {
  const { documentValidationService } = useRestContext()
  const {
    data: documents = [],
    error: documentsError,
    isFetching: isFetchingDocuments,
    refetch: refetchDocuments,
  } = useQuery({
    queryKey: DOCUMENT_VALIDATION_DOCUMENTS_QUERY_KEY,
    queryFn: async () => {
      const response = await documentValidationService.listDocuments()

      if (response.isFailure) response.throwError()

      return response.body
    },
  })

  return {
    documents,
    documentsError,
    isFetchingDocuments,
    refetchDocuments,
  }
}
