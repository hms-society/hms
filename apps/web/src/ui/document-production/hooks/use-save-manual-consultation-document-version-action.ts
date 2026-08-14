import type { DocumentVersion } from '@hms/core/document-production/domain/entities'
import type { DocumentTemplateContent } from '@hms/core/document-production/domain/structures'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { consultationDocumentQueryKeys } from './consultation-document-query-keys'
import { resolveConsultationDocumentActionResponse } from './consultation-document-action-result'

type SaveManualConsultationDocumentVersionRequest = {
  readonly consultationId: string
  readonly documentId: string
  readonly sourceDocumentVersionId: string
  readonly content: DocumentTemplateContent
}

export const useSaveManualConsultationDocumentVersionAction = () => {
  const queryClient = useQueryClient()
  const { consultationDocumentProductionService } = useRestContext()

  const mutation = useMutation({
    mutationFn: async function saveManualConsultationDocumentVersion(
      request: SaveManualConsultationDocumentVersionRequest,
    ) {
      const response = await consultationDocumentProductionService.saveManualVersion(
        request.consultationId,
        request.documentId,
        request.sourceDocumentVersionId,
        request.content,
      )

      return resolveConsultationDocumentActionResponse<DocumentVersion>(response)
    },
    onSuccess: function invalidateConsultationDocumentQueries(
      _result,
      request: SaveManualConsultationDocumentVersionRequest,
    ) {
      void queryClient.invalidateQueries({
        queryKey: consultationDocumentQueryKeys.list(request.consultationId),
      })
      void queryClient.invalidateQueries({
        queryKey: consultationDocumentQueryKeys.version(
          request.consultationId,
          request.documentId,
          request.sourceDocumentVersionId,
        ),
      })
    },
  })

  return {
    saveManualVersion: mutation.mutateAsync,
    savedManualVersion: mutation.data?.body,
    saveManualVersionError: mutation.error,
    isSavingManualVersion: mutation.isPending,
    isSaveManualVersionSuccess: Boolean(mutation.data?.body),
    isSaveManualVersionConflict: mutation.data?.isConflict ?? false,
  }
}
