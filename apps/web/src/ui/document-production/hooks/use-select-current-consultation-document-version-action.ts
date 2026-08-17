import type { Document } from '@hms/core/document-production/domain/entities'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { consultationDocumentQueryKeys } from './consultation-document-query-keys'
import { resolveConsultationDocumentActionResponse } from './consultation-document-action-result'

type SelectCurrentConsultationDocumentVersionRequest = {
  readonly consultationId: string
  readonly documentId: string
  readonly documentVersionId: string
}

export const useSelectCurrentConsultationDocumentVersionAction = () => {
  const queryClient = useQueryClient()
  const { consultationDocumentProductionService } = useRestContext()

  const mutation = useMutation({
    mutationFn: async function selectCurrentConsultationDocumentVersion(
      request: SelectCurrentConsultationDocumentVersionRequest,
    ) {
      const response = await consultationDocumentProductionService.selectCurrentVersion(
        request.consultationId,
        request.documentId,
        request.documentVersionId,
      )

      return resolveConsultationDocumentActionResponse<Document>(response)
    },
    onSuccess: function invalidateConsultationDocumentQueries(
      _result,
      request: SelectCurrentConsultationDocumentVersionRequest,
    ) {
      void queryClient.invalidateQueries({
        queryKey: consultationDocumentQueryKeys.list(request.consultationId),
      })
      void queryClient.invalidateQueries({
        queryKey: consultationDocumentQueryKeys.version(
          request.consultationId,
          request.documentId,
          request.documentVersionId,
        ),
      })
    },
  })

  return {
    selectCurrentVersion: mutation.mutateAsync,
    selectedCurrentDocument: mutation.data?.body,
    selectCurrentVersionError: mutation.error,
    isSelectingCurrentVersion: mutation.isPending,
    isSelectCurrentVersionSuccess: Boolean(mutation.data?.body),
    isSelectCurrentVersionConflict: mutation.data?.isConflict ?? false,
  }
}
