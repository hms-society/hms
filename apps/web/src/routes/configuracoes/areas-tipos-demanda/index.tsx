import { createFileRoute } from '@tanstack/react-router'
import { requireAdminMiddleware } from '@/middlewares/require-admin-middleware'
import { LegalCatalogAdminPage } from '@/ui/identity/widgets/pages/legal-catalog-admin-page'
import { AppLayout } from '@/ui/shared/widgets/layouts/app-layout'

export const Route = createFileRoute('/configuracoes/areas-tipos-demanda/')({
  beforeLoad: requireAdminMiddleware,
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <AppLayout>
      <LegalCatalogAdminPage />
    </AppLayout>
  )
}
