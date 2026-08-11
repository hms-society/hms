import { createFileRoute } from '@tanstack/react-router'
import { NewClientPage } from '@/ui/identity/widgets/pages/intake-client-procedures/clients-management/new-client-page'
import { AppLayout } from '@/ui/shared/widgets/layouts/app-layout'

export const Route = createFileRoute('/clientes/novo')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <AppLayout>
      <NewClientPage />
    </AppLayout>
  )
}
