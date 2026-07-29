import { createFileRoute } from '@tanstack/react-router'

import { requireAuthMiddleware } from '@/middlewares/require-auth-middleware'
import { ForgotPasswordPage } from '@/ui/identity/widgets/pages/forget-password-page'

export const Route = createFileRoute('/forgot-password/')({
  beforeLoad: requireAuthMiddleware,
  component: ForgotPasswordPage,
  ssr: false,
})
