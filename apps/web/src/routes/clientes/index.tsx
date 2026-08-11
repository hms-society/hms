import { createFileRoute } from '@tanstack/react-router'
import { ClientsListPage } from '@/ui/identity/widgets/pages/intake-client-procedures/clients-management'
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
