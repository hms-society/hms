import { Outlet, createFileRoute } from '@tanstack/react-router'

import { requireAuthMiddleware } from '@/middlewares/require-auth-middleware'
import { AppLayout } from '@/ui/shared/widgets/layouts/app-layout'

export const Route = createFileRoute('/formalizacoes')({
  beforeLoad: requireAuthMiddleware,
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
  ssr: false,
})
