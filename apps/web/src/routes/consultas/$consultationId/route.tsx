import { Outlet, createFileRoute } from '@tanstack/react-router'

import { ConsultationPage } from '@/ui/consultation/widgets/pages/consultation-page'
import { ConsultationPageActionProvider } from '@/ui/consultation/widgets/pages/consultation-page/consultation-page-action-context'

export const Route = createFileRoute('/consultas/$consultationId')({
  component: ConsultationRouteLayout,
})

function ConsultationRouteLayout() {
  const { consultationId } = Route.useParams()

  return (
    <ConsultationPageActionProvider>
      <ConsultationPage consultationId={consultationId}>
        <Outlet />
      </ConsultationPage>
    </ConsultationPageActionProvider>
  )
}
