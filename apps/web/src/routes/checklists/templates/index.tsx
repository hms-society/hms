import { createFileRoute } from '@tanstack/react-router'
import { requireAdminMiddleware } from '@/middlewares/require-admin-middleware'
import ChecklistsTemplatesPage from '@/ui/identity/widgets/pages/checklists-templates'
import { AppLayout } from '@/ui/shared/widgets/layouts/app-layout'

export const Route = createFileRoute('/checklists/templates/')({
  beforeLoad: requireAdminMiddleware,
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <AppLayout>
      <ChecklistsTemplatesPage />
    </AppLayout>
  )
}
