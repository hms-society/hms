import { createFileRoute } from '@tanstack/react-router'

import { ROUTES } from '@/constants/routes'
import { AttendanceForm } from '@/ui/consultation/widgets/pages/consultation-page/attendance-form'

export const Route = createFileRoute('/consultas/$consultationId/ficha-atendimento')({
  component: ConsultationAttendanceFormRoute,
})

function ConsultationAttendanceFormRoute() {
  const { consultationId } = Route.useParams()
  const navigate = Route.useNavigate()

  function handleFinalized() {
    return navigate({
      to: ROUTES.consultationDocuments,
      params: { consultationId },
    })
  }

  return <AttendanceForm consultationId={consultationId} onFinalized={handleFinalized} />
}
