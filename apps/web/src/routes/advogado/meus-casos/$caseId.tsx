import { Outlet, createFileRoute, useRouterState } from '@tanstack/react-router'

import { CasoDetalheChecklistPage } from '@/ui/identity/widgets/pages/lawyer-page/my-case-page'

export const Route = createFileRoute('/advogado/meus-casos/$caseId')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): { tab?: 'pecas' } => {
    return search.tab === 'pecas' ? { tab: 'pecas' } : {}
  },
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
