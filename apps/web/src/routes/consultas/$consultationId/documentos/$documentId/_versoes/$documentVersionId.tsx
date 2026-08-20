import { createFileRoute } from '@tanstack/react-router'

import { ConsultationDocumentVersionPage } from '@/ui/document-production/widgets/pages/consultation-document-version-page'

const ConsultationDocumentVersionRoute = () => {
  const { consultationId, documentId, documentVersionId } = Route.useParams()

  return (
    <ConsultationDocumentVersionPage
      consultationId={consultationId}
      documentId={documentId}
      documentVersionId={documentVersionId}
    />
  )
}

export const Route = createFileRoute(
  '/consultas/$consultationId/documentos/$documentId/_versoes/$documentVersionId',
)({
  component: ConsultationDocumentVersionRoute,
})
