import { createFileRoute } from '@tanstack/react-router'

import { PieceWorkflowRoutePage } from '@/ui/identity/widgets/pages/lawyer-page/piece-workflow-route-page'

export const Route = createFileRoute(
  '/advogado_/meus-casos_/$caseId/pecas/$documentId/editor',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { caseId, documentId } = Route.useParams()
  return <PieceWorkflowRoutePage mode='editor' caseId={caseId} documentId={documentId} />
}
