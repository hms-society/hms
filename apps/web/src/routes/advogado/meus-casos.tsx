import { createFileRoute } from '@tanstack/react-router'
import { CasoDetalheChecklistPage } from '@/ui/identity/widgets/pages/lawyer-page/my-case-page'

export const Route = createFileRoute('/advogado/meus-casos')({
  component: RouteComponent,
})

function RouteComponent() {
  return <CasoDetalheChecklistPage />
}
