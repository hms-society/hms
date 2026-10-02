import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { PieceViewerPage } from '@/ui/identity/widgets/pages/lawyer-page/piece-viewer-page'

export const Route = createFileRoute('/advogado_/meus-casos_/$caseId/pecas/$documentId/')(
  {
    component: PieceViewerRoute,
  },
)

function PieceViewerRoute() {
  const { caseId, documentId } = Route.useParams()
  const navigate = useNavigate()

  return (
    <PieceViewerPage
      caseId={caseId}
      documentId={documentId}
      onClose={() => navigate({ to: '/advogado/meus-casos/$caseId', params: { caseId } })}
      onOpenEditor={() =>
        navigate({
          to: '/advogado/meus-casos/$caseId/pecas/$documentId/editor',
          params: { caseId, documentId },
        })
      }
      onOpenReview={() =>
        navigate({
          to: '/advogado/meus-casos/$caseId/pecas/$documentId/revisao',
          params: { caseId, documentId },
        })
      }
    />
  )
}
