import { Outlet, createFileRoute, useRouterState } from '@tanstack/react-router'

import { requireCaseReaderMiddleware } from '@/middlewares/require-case-reader-middleware'
import { RouteAccessError } from '@/ui/shared/widgets/components/route-access-error'
import { CasoDetalheChecklistPage } from '@/ui/identity/widgets/pages/lawyer-page/my-case-page'

export const Route = createFileRoute('/advogado/meus-casos/$caseId')({
  beforeLoad: requireCaseReaderMiddleware,
  errorComponent: RouteAccessError,
  component: RouteComponent,
})

function RouteComponent() {
  const { caseId } = Route.useParams()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const isPieceRoute = pathname.includes(`/meus-casos/${caseId}/pecas/`)

  return (
    <>
      {!isPieceRoute && <CasoDetalheChecklistPage caseId={caseId} />}
      <Outlet />
    </>
  )
}
