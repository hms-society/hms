import { createFileRoute } from '@tanstack/react-router'

import { IntakeDetailsPage } from '@/ui/intake/widgets/pages/intake-details-page'
import { IntakeDetailsLoading } from '@/ui/intake/widgets/pages/intake-details-page/intake-details-content'

export const Route = createFileRoute('/intakes/$intakeId')({
  component: IntakeDetailsRoute,
  pendingComponent: IntakeDetailsLoading,
  ssr: false,
})

function IntakeDetailsRoute() {
  const { intakeId } = Route.useParams()

  return <IntakeDetailsPage intakeId={intakeId} />
}
