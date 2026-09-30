import { Outlet, createFileRoute } from '@tanstack/react-router'
import { AppLayout } from '@/ui/shared/widgets/layouts/app-layout'
import { requireAuthMiddleware } from '@/middlewares/require-auth-middleware'
import { AgendaTabs } from '@/ui/scheduling/widgets/pages/agenda-tabs'

export const Route = createFileRoute('/agenda')({
  beforeLoad: requireAuthMiddleware,
  component: () => (
    <AppLayout>
      <div className='flex w-full flex-col'>
        <AgendaTabs />
        <Outlet />
      </div>
    </AppLayout>
  ),
  ssr: false,
})
