import { Outlet, createFileRoute } from '@tanstack/react-router'
import { AppLayout } from '@/ui/shared/widgets/layouts/app-layout'
import { requireAuthMiddleware } from '@/middlewares/require-auth-middleware'

export const Route = createFileRoute('/agenda')({
  beforeLoad: requireAuthMiddleware,
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
  ssr: false,
})
