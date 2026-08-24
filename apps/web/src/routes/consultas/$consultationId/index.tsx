import { createFileRoute } from '@tanstack/react-router'

import { ROUTES } from '@/constants/routes'
import { ConsultationDetails } from '@/ui/consultation/widgets/pages/consultation-page/consultation-details'

export const Route = createFileRoute('/consultas/$consultationId/')({
  component: ConsultationDetailsRoute,
})

function ConsultationDetailsRoute() {
  const { consultationId } = Route.useParams()
  const navigate = Route.useNavigate()

  function handleContinueForm() {
    void navigate({
      to: ROUTES.consultationAttendanceForm,
      params: { consultationId },
    })
  }

  return (
    <ConsultationDetails
      consultationId={consultationId}
      onContinueForm={handleContinueForm}
    />
  )
}
