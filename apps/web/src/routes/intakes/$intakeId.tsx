import { createFileRoute } from '@tanstack/react-router'

import { requireAuthMiddleware } from '@/middlewares/require-auth-middleware'
import { IntakeDetailsPage } from '@/ui/intake/widgets/pages/intake-details-page'

const IntakeDetailsRoute = () => {
  const { intakeId } = Route.useParams()

  return <IntakeDetailsPage intakeId={intakeId} />
}

export const Route = createFileRoute('/intakes/$intakeId')({
  beforeLoad: requireAuthMiddleware,
  component: IntakeDetailsRoute,
  ssr: false,
})
