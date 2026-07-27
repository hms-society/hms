import { createFileRoute } from '@tanstack/react-router'

import { ROUTES } from '@/constants/routes'
import { SignInPage } from '@/ui/identity/widgets/pages/sign-in'

export const Route = createFileRoute(ROUTES.signIn)({ component: SignInPage })
