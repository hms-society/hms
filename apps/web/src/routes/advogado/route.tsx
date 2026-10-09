import { Outlet, createFileRoute, useRouterState } from '@tanstack/react-router'

import { requireAuthMiddleware } from '@/middlewares/require-auth-middleware'
import { AppLayout } from '@/ui/shared/widgets/layouts/app-layout'

export const Route = createFileRoute('/advogado')({
  beforeLoad: requireAuthMiddleware,
  component: LawyerRouteLayout,
  ssr: false,
})

function LawyerRouteLayout() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const isPieceWorkflowRoute =
    /\/advogado\/meus-casos\/[^/]+\/pecas\/[^/]+\/(editor|revisao)$/.test(pathname)

  if (isPieceWorkflowRoute) {
    return (
      <main className='min-h-screen w-full bg-background text-foreground'>
        <Outlet />
      </main>
    )
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
}
