import { createFileRoute } from '@tanstack/react-router'

import { ChecklistItemDetailPage } from '@/ui/identity/widgets/pages/lawyer-page/my-case-page/checklist-item-detail-page'

export const Route = createFileRoute(
  '/advogado/meus-casos_/$caseId/checklist/$checklistItemId',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { caseId, checklistItemId } = Route.useParams()

  return <ChecklistItemDetailPage caseId={caseId} checklistItemId={checklistItemId} />
}
