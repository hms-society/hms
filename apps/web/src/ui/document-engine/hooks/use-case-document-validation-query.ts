import { useQuery, useQueryClient } from '@tanstack/react-query'
import { HTTP_STATUS_CODE } from '@hms/core/shared/constants'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useCaseDocumentValidationQuery(
  caseId: string,
  actorId: string | undefined,
  enabled = true,
) {
  const { documentValidationService } = useRestContext()
  const queryClient = useQueryClient()
  const queryKey = ['document-validation', 'documents', { caseId, actorId }] as const
  const {
    data: documentValidationDocuments = [],
    error: documentValidationError,
    isLoading: isLoadingDocumentValidationDocuments,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await documentValidationService.listDocuments({ caseId })
      if (response.isFailure && response.statusCode === HTTP_STATUS_CODE.forbidden) {
        queryClient.setQueryData(queryKey, [])
      }
      if (response.isFailure) response.throwError()
      return response.body
    },
    enabled: enabled && Boolean(caseId),
    retry: false,
  })

  return {
    documentValidationDocuments,
    documentValidationError,
    isLoadingDocumentValidationDocuments,
  }
}
