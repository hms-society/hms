import { createFileRoute } from '@tanstack/react-router'

import { redirectAuthenticatedMiddleware } from '@/middlewares/redirect-authenticated-middleware'
import { SignInPage } from '@/ui/identity/widgets/pages/sign-in-page'

export const Route = createFileRoute('/login/')({
  beforeLoad: redirectAuthenticatedMiddleware,
  component: SignInPage,
  ssr: false,
})
