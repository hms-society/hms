import { createFileRoute } from '@tanstack/react-router'

import { IntakeDetailsPage } from '@/ui/intake/widgets/pages/intake-details-page'

export const Route = createFileRoute('/intakes/$intakeId')({
  component: IntakeDetailsRoute,
  ssr: false,
})

function IntakeDetailsRoute() {
  const { intakeId } = Route.useParams()

  return <IntakeDetailsPage intakeId={intakeId} />
}
