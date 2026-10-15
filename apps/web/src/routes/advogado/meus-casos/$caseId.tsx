import { Outlet, createFileRoute, useRouterState } from '@tanstack/react-router'

import { CollaboratorProfile } from '@hms/core/identity/domain/structures'
import { requireCaseReaderMiddleware } from '@/middlewares/require-case-reader-middleware'
import { RouteAccessError } from '@/ui/shared/widgets/components/route-access-error'
import { CasoDetalheChecklistPage } from '@/ui/identity/widgets/pages/lawyer-page/my-case-page'

export const Route = createFileRoute('/advogado/meus-casos/$caseId')({
  beforeLoad: requireCaseReaderMiddleware,
  component: RouteComponent,
  errorComponent: RouteAccessError,
  validateSearch: (search: Record<string, unknown>): { tab?: 'checklist' | 'pecas' } => {
    return search.tab === 'checklist' || search.tab === 'pecas' ? { tab: search.tab } : {}
  },
})

function RouteComponent() {
  const { caseId } = Route.useParams()
  const { currentCollaborator } = Route.useRouteContext()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const isPieceRoute = pathname.includes(`/meus-casos/${caseId}/pecas/`)

  return (
    <>
      {!isPieceRoute && (
        <CasoDetalheChecklistPage
          caseId={caseId}
          isAdministrator={currentCollaborator.profile === CollaboratorProfile.Admin}
        />
      )}
      <Outlet />
    </>
  )
}
