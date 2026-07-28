import { createFileRoute } from '@tanstack/react-router'

import { requireAuthMiddleware } from '@/middlewares/require-auth-middleware'
import { HomePage } from '@/ui/identity/widgets/pages/home-page'

export const Route = createFileRoute('/home/')({
  beforeLoad: requireAuthMiddleware,
  component: HomePage,
  ssr: false,
})
