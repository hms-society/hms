import { createFileRoute } from '@tanstack/react-router'
import { ClientsListPage } from '@/ui/identity/widgets/pages/clients-list-page'
import { AppLayout } from '@/ui/shared/widgets/layouts/app-layout'

export const Route = createFileRoute('/clientes/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <AppLayout>
      <ClientsListPage />
    </AppLayout>
  )
}
