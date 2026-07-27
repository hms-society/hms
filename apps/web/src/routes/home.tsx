import { createFileRoute } from '@tanstack/react-router'

import { ROUTES } from '@/constants/routes'
import { HomePage } from '@/ui/identity/widgets/pages/home'

export const Route = createFileRoute(ROUTES.home)({
  component: HomePage,
})
