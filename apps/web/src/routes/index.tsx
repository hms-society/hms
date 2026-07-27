import { createFileRoute } from '@tanstack/react-router'

import { ROUTES } from '@/constants/routes'
import { LandingPage } from '@/ui/identity/widgets/pages/landing'

export const Route = createFileRoute(ROUTES.root)({ component: LandingPage })
