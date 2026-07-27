import { createFileRoute } from '@tanstack/react-router'

import { ROUTES } from '@/constants/routes'
import { IntakesPage } from '@/ui/intake/widgets/pages/intakes'

export const Route = createFileRoute(`${ROUTES.intakes}/`)({
  component: IntakesPage,
})
