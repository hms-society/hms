import { createFileRoute } from '@tanstack/react-router'
import { requireAdminMiddleware } from '@/middlewares/require-admin-middleware'
import { AdminCaseSummaryPage } from '@/ui/case-management/widgets/pages/admin-case-summary-page'
import { AppLayout } from '@/ui/shared/widgets/layouts/app-layout'

export const Route = createFileRoute('/admin/casos/$caseId')({
  beforeLoad: requireAdminMiddleware,
  component: AdminCaseSummaryRoute,
  ssr: false,
})

function AdminCaseSummaryRoute() {
  const { caseId } = Route.useParams()
  return (
    <AppLayout>
      <AdminCaseSummaryPage caseId={caseId} />
    </AppLayout>
  )
}
