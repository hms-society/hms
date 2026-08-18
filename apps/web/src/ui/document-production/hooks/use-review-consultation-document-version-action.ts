import type { DocumentVersion } from '@hms/core/document-production/domain/entities'
import type { ConsultationDocumentVersionReviewRequest } from '@hms/core/consultation/domain/structures'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { consultationDocumentQueryKeys } from './consultation-document-query-keys'
import { resolveConsultationDocumentActionResponse } from './consultation-document-action-result'

type ReviewConsultationDocumentVersionRequest = {
  readonly consultationId: string
  readonly documentId: string
  readonly documentVersionId: string
  readonly request: ConsultationDocumentVersionReviewRequest
}

export const useReviewConsultationDocumentVersionAction = () => {
  const queryClient = useQueryClient()
  const { consultationDocumentProductionService } = useRestContext()

  const mutation = useMutation({
    mutationFn: async function reviewConsultationDocumentVersion(
      request: ReviewConsultationDocumentVersionRequest,
    ) {
      const response = await consultationDocumentProductionService.reviewVersion(
        request.consultationId,
        request.documentId,
        request.documentVersionId,
        request.request,
      )

      return resolveConsultationDocumentActionResponse<DocumentVersion>(response)
    },
    onSuccess: function invalidateConsultationDocumentQueries(
      _result,
      request: ReviewConsultationDocumentVersionRequest,
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
    reviewVersion: mutation.mutateAsync,
    reviewedVersion: mutation.data?.body,
    reviewVersionError: mutation.error,
    isReviewingVersion: mutation.isPending,
    isReviewVersionSuccess: Boolean(mutation.data?.body),
    isReviewVersionConflict: mutation.data?.isConflict ?? false,
  }
}
