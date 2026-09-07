import { createFileRoute } from '@tanstack/react-router'

import { ROUTES } from '@/constants/routes'
import { redirectAuthenticatedMiddleware } from '@/middlewares/redirect-authenticated-middleware'
import { SignInPage } from '@/ui/identity/widgets/pages/sign-in-page'

export const Route = createFileRoute('/login/')({
  beforeLoad: ({ search }) => redirectAuthenticatedMiddleware(search),
  component: LoginRoute,
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    returnTo:
      search.returnTo === ROUTES.signingGateway ? ROUTES.signingGateway : undefined,
  }),
})

function LoginRoute() {
  return <SignInPage />
}
