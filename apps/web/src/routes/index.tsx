import { createFileRoute } from '@tanstack/react-router'

import { LandingPage } from '@/ui/shared/widgets/pages/landing-page'

export const Route = createFileRoute('/')({ component: LandingPage })
