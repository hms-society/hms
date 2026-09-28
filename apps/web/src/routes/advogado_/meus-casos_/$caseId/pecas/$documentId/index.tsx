import { createFileRoute } from '@tanstack/react-router'

import { PieceViewerPage } from '@/ui/identity/widgets/pages/lawyer-page/piece-viewer-page'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

export const Route = createFileRoute('/advogado_/meus-casos_/$caseId/pecas/$documentId/')({
  component: PieceViewerRoute,
})

function PieceViewerRoute() {
  const { caseId, documentId } = Route.useParams()
  const { navigateTo } = useNavigation()

  return (
    <PieceViewerPage
      caseId={caseId}
      documentId={documentId}
      onClose={() => void navigateTo('lawyerCaseDetails', { params: { caseId } })}
      onOpenEditor={() =>
        void navigateTo('lawyerCasePieceEditor', {
          params: { caseId, documentId },
        })
      }
      onOpenReview={() =>
        void navigateTo('lawyerCasePieceReview', {
          params: { caseId, documentId },
        })
      }
    />
  )
}
