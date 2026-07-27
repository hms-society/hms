import { createFileRoute } from '@tanstack/react-router'

import { ROUTES } from '@/constants/routes'
import { NewIntakePage } from '@/ui/intake/widgets/pages/new-intake'

export const Route = createFileRoute(ROUTES.newIntake)({
  component: NewIntakePage,
})
