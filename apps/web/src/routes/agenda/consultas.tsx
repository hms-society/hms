import { createFileRoute } from '@tanstack/react-router'

import { calendarSearchSchema } from '@hms/validation/scheduling'
import { AppointmentsPage } from '@/ui/scheduling/widgets/pages/appointments-page'

export const Route = createFileRoute('/agenda/consultas')({
  validateSearch: calendarSearchSchema,
  component: AppointmentsPage,
})
