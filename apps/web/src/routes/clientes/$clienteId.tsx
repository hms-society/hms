import { createFileRoute } from '@tanstack/react-router'
import { ClientDetailsPage } from '@/ui/identity/widgets/pages/client-page/client-detail'
import { AppLayout } from '@/ui/shared/widgets/layouts/app-layout'

export const Route = createFileRoute('/clientes/$clienteId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { clienteId } = Route.useParams()

  return (
    <AppLayout>
      <ClientDetailsPage clientId={clienteId} />
    </AppLayout>
  )
}
