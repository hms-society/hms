import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import type { DocumentTemplateContent } from '@hms/core/document-production/domain/structures'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

export type PieceWorkflowRoutePageMode = 'editor' | 'review'

export type UsePieceWorkflowRoutePageProps = {
  mode: PieceWorkflowRoutePageMode
  caseId: string
  documentId: string
}

export function usePieceWorkflowRoutePage({
  mode,
  caseId,
  documentId,
}: UsePieceWorkflowRoutePageProps) {
  const { caseDocumentProductionService, caseManagementService } = useRestContext()
  const { navigateTo } = useNavigation()
  const [reviewAction, setReviewAction] = useState<
    'adjustments' | 'block' | 'approval' | null
  >(null)
  const [isReviewConfirmed, setIsReviewConfirmed] = useState(false)
  const [editedContent, setEditedContent] = useState<DocumentTemplateContent | null>(null)
  const {
    data: documentResponse,
    error: documentError,
    isError: isDocumentError,
    isLoading: isLoadingDocument,
  } = useQuery({
    queryKey: ['case-document', caseId, documentId],
    queryFn: () => caseDocumentProductionService.getDocument(caseId, documentId),
  })
  const { data: caseDetails } = useQuery({
    queryKey: ['case-details', caseId],
    queryFn: async () => {
      const response = await caseManagementService.getLegalCaseDetails(caseId)
      if (response.isFailure) response.throwError()
      return response.body
    },
  })
  const document = documentResponse?.body
  const version =
    document?.versions.find((item) => item.id === document.currentVersionId) ??
    document?.versions.at(-1)

  function handleBackToCase() {
    void navigateTo('lawyerCaseDetails', { params: { caseId } })
  }

  function handleOpenReview() {
    void navigateTo('lawyerCasePieceReview', {
      params: { caseId, documentId },
    })
  }

  function handleCloseReviewAction() {
    setReviewAction(null)
  }

  function handleConfirmReviewAction() {
    if (reviewAction === 'adjustments') {
      void navigateTo('lawyerCasePieceEditor', {
        params: { caseId, documentId },
        search: { reviewState: 'adjustments_requested' },
      })
    }
    setReviewAction(null)
  }

  function handleOpenReviewAction(action: 'adjustments' | 'block' | 'approval') {
    setReviewAction(action)
  }

  function handleReviewConfirmationChange(confirmed: boolean) {
    setIsReviewConfirmed(confirmed)
  }

  function handleChangeContent(content: DocumentTemplateContent) {
    setEditedContent(content)
  }

  return {
    document,
    documentError,
    documentId,
    editedContent,
    isDocumentError,
    isLoadingDocument,
    isReviewConfirmed,
    mode,
    reviewAction,
    version,
    caseId,
    casePublicCode: caseDetails?.publicCode,
    handleBackToCase,
    handleChangeContent,
    handleCloseReviewAction,
    handleConfirmReviewAction,
    handleOpenReview,
    handleOpenReviewAction,
    handleReviewConfirmationChange,
  }
}
