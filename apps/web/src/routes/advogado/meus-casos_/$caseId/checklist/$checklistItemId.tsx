import { createFileRoute } from '@tanstack/react-router'

import { requireCaseReaderMiddleware } from '@/middlewares/require-case-reader-middleware'
import { ChecklistItemDetailPage } from '@/ui/identity/widgets/pages/lawyer-page/my-case-page/checklist-item-detail-page'
import { RouteAccessError } from '@/ui/shared/widgets/components/route-access-error'

function requireChecklistCaseReaderMiddleware<
  RouteContext extends { params: { caseId?: string } },
>(routeContext: RouteContext) {
  return requireCaseReaderMiddleware({ ...routeContext, legalContentOnly: true })
}

export const Route = createFileRoute(
  '/advogado/meus-casos_/$caseId/checklist/$checklistItemId',
)({
  beforeLoad: requireChecklistCaseReaderMiddleware,
  component: RouteComponent,
  errorComponent: RouteAccessError,
})

function RouteComponent() {
  const { caseId, checklistItemId } = Route.useParams()

  return <ChecklistItemDetailPage caseId={caseId} checklistItemId={checklistItemId} />
}
