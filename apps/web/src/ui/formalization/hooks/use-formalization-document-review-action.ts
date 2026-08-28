import type { DocumentTemplateContent } from '@hms/core/document-production/domain/structures'
import type { ReviewFormalizationDocumentVersionRequest } from '@hms/core/formalization/interfaces'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { getFormalizationDocumentsQueryKey } from './use-formalization-document-production-action'

export const useFormalizationDocumentReviewAction = (formalizationId: string) => {
  const { formalizationService } = useRestContext()
  const queryClient = useQueryClient()

  async function invalidateDocuments() {
    await queryClient.invalidateQueries({
      queryKey: getFormalizationDocumentsQueryKey(formalizationId),
    })
  }

  const saveManualVersionMutation = useMutation({
    mutationFn: async ({
      versionId,
      content,
    }: {
      versionId: string
      content: DocumentTemplateContent
    }) => {
      const response = await formalizationService.saveManualVersion(
        formalizationId,
        versionId,
        { sourceDocumentVersionId: versionId, content },
      )
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: invalidateDocuments,
  })

  const reviewVersionMutation = useMutation({
    mutationFn: async ({
      versionId,
      request,
    }: {
      versionId: string
      request: ReviewFormalizationDocumentVersionRequest
    }) => {
      const response = await formalizationService.reviewVersion(
        formalizationId,
        versionId,
        request,
      )
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: invalidateDocuments,
  })

  const selectCurrentVersionMutation = useMutation({
    mutationFn: async ({
      documentId,
      versionId,
    }: {
      documentId: string
      versionId: string
    }) => {
      const response = await formalizationService.selectCurrentVersion(
        formalizationId,
        documentId,
        versionId,
      )
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: invalidateDocuments,
  })

  const regenerateDocumentMutation = useMutation({
    mutationFn: async ({
      documentId,
      instructions,
    }: {
      documentId: string
      instructions?: string
    }) => {
      const response = await formalizationService.generateDocument(
        formalizationId,
        documentId,
        instructions ? { instructions } : undefined,
      )
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: invalidateDocuments,
  })

  return {
    isRegeneratingDocument: regenerateDocumentMutation.isPending,
    isReviewingVersion: reviewVersionMutation.isPending,
    isSavingManualVersion: saveManualVersionMutation.isPending,
    isSelectingCurrentVersion: selectCurrentVersionMutation.isPending,
    regenerateDocumentError: regenerateDocumentMutation.error,
    reviewVersionError: reviewVersionMutation.error,
    saveManualVersionError: saveManualVersionMutation.error,
    selectCurrentVersionError: selectCurrentVersionMutation.error,
    regenerateDocument: regenerateDocumentMutation.mutateAsync,
    reviewVersion: reviewVersionMutation.mutateAsync,
    saveManualVersion: saveManualVersionMutation.mutateAsync,
    selectCurrentVersion: selectCurrentVersionMutation.mutateAsync,
  }
}
