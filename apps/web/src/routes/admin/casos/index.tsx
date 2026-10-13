import { createFileRoute } from '@tanstack/react-router'
import {
  adminCasesQuerySchema,
  type AdminCasesQueryData,
} from '@hms/validation/case-management'

import { requireAdminMiddleware } from '@/middlewares/require-admin-middleware'
import { AdminCasesListPage } from '@/ui/case-management/widgets/pages/admin-cases-list-page'
import { AppLayout } from '@/ui/shared/widgets/layouts/app-layout'

const DEFAULT_SEARCH = { page: 1, pageSize: 50 }

export const Route = createFileRoute('/admin/casos/')({
  beforeLoad: requireAdminMiddleware,
  component: AdminCasesRoute,
  ssr: false,
  validateSearch: (search: Record<string, unknown>): AdminCasesQueryData => {
    const result = adminCasesQuerySchema.safeParse(search)
    return result.success ? result.data : { ...DEFAULT_SEARCH, search: undefined }
  },
})

function AdminCasesRoute() {
  return (
    <AppLayout>
      <AdminCasesListPage />
    </AppLayout>
  )
}
