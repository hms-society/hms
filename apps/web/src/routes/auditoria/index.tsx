import { createFileRoute } from '@tanstack/react-router'

import { requireAdminOrSupervisorMiddleware } from '@/middlewares/require-admin-or-supervisor-middleware'
import { AuditLogsPage } from '@/ui/shared/widgets/pages/audit-logs-page'
import { AppLayout } from '@/ui/shared/widgets/layouts/app-layout'

export const Route = createFileRoute('/auditoria/')({
  beforeLoad: requireAdminOrSupervisorMiddleware,
  component: AuditLogsRoute,
  ssr: false,
})

function AuditLogsRoute() {
  return (
    <AppLayout>
      <AuditLogsPage />
    </AppLayout>
  )
}
