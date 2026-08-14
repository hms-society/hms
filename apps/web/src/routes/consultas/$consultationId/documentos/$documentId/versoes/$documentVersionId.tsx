import { createFileRoute } from '@tanstack/react-router'

import { ConsultationDocumentReviewPage } from '@/ui/document-production/widgets/pages/consultation-document-review-page'

export const Route = createFileRoute(
  '/consultas/$consultationId/documentos/$documentId/versoes/$documentVersionId',
)({
  component: ConsultationDocumentReviewRoute,
})

function ConsultationDocumentReviewRoute() {
  const { consultationId, documentId, documentVersionId } = Route.useParams()

  return (
    <ConsultationDocumentReviewPage
      consultationId={consultationId}
      documentId={documentId}
      documentVersionId={documentVersionId}
    />
  )
}
