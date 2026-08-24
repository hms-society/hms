import { DocumentVersionStatus } from '@hms/core/document-production/domain/structures'
import { useMemo, useState } from 'react'

import { useConsultationQuery } from '@/ui/consultation/hooks/use-consultation-query'
import { useConsultationDocumentsQuery } from '../../../hooks/use-consultation-documents-query'
import { useConsultationDocumentVersionQuery } from '../../../hooks/use-consultation-document-version-query'
import { useReviewConsultationDocumentVersionAction } from '../../../hooks/use-review-consultation-document-version-action'

export type ConsultationDocumentVersionPageProps = {
  consultationId: string
  documentId: string
  documentVersionId: string
}

export function useConsultationDocumentVersionPage({
  consultationId,
  documentId,
  documentVersionId,
}: ConsultationDocumentVersionPageProps) {
  const versionQuery = useConsultationDocumentVersionQuery(
    consultationId,
    documentId,
    documentVersionId,
  )
  const documentsQuery = useConsultationDocumentsQuery(consultationId)
  const consultationQuery = useConsultationQuery(consultationId)
  const reviewAction = useReviewConsultationDocumentVersionAction()
  const [rejectionReason, setRejectionReason] = useState('')
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)

  const document = useMemo(
    () => documentsQuery.data?.find((item) => item.id === documentId),
    [documentId, documentsQuery.data],
  )
  const version = versionQuery.documentVersion
  const isReviewable =
    version?.status === DocumentVersionStatus.InReview &&
    consultationQuery.consultation?.status === 'pending'

  function handleOpenRejectDialog() {
    setRejectionReason('')
    setIsRejectDialogOpen(true)
  }

  function handleRejectDialogOpenChange(open: boolean) {
    setIsRejectDialogOpen(open)
    if (!open) setRejectionReason('')
  }

  async function handleApprove() {
    if (!version || !isReviewable) return

    await reviewAction.reviewVersion({
      consultationId,
      documentId,
      documentVersionId,
      request: { decision: DocumentVersionStatus.Approved },
    })
  }

  async function handleReject() {
    if (!version || !isReviewable || !rejectionReason.trim()) return

    await reviewAction.reviewVersion({
      consultationId,
      documentId,
      documentVersionId,
      request: {
        decision: DocumentVersionStatus.Rejected,
        rejectionReason: rejectionReason.trim(),
      },
    })
    setIsRejectDialogOpen(false)
    setRejectionReason('')
  }

  return {
    document,
    handleApprove,
    handleOpenRejectDialog,
    handleReject,
    handleRejectDialogOpenChange,
    isError: Boolean(versionQuery.documentVersionError),
    isLoading: versionQuery.isLoadingDocumentVersion,
    isRejectDialogOpen,
    isReviewable,
    isReviewing: reviewAction.isReviewingVersion,
    rejectionReason,
    setRejectionReason,
    version,
  }
}
