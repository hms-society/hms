import { createFileRoute } from '@tanstack/react-router'

import { PieceWorkflowRoutePage } from '@/ui/identity/widgets/pages/lawyer-page/piece-workflow-route-page'

export const Route = createFileRoute(
  '/advogado_/meus-casos_/$caseId/pecas/$documentId/editor',
)({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => ({
    reviewState:
      search.reviewState === 'adjustments_requested'
        ? 'adjustments_requested'
        : undefined,
  }),
  ssr: false,
})

function RouteComponent() {
  const { caseId, documentId } = Route.useParams()
  const { reviewState } = Route.useSearch()
  return (
    <PieceWorkflowRoutePage
      mode='editor'
      caseId={caseId}
      documentId={documentId}
      adjustmentsRequested={reviewState === 'adjustments_requested'}
    />
  )
}
