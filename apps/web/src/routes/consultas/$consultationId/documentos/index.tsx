import { createFileRoute } from '@tanstack/react-router'

import { ConsultationDocumentsPage } from '@/ui/document-production/widgets/pages/consultation-documents-page'

export const Route = createFileRoute('/consultas/$consultationId/documentos/')({
  component: ConsultationDocumentsRoute,
})

function ConsultationDocumentsRoute() {
  const { consultationId } = Route.useParams()

  return <ConsultationDocumentsPage consultationId={consultationId} />
}
