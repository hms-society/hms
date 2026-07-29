import { createFileRoute } from '@tanstack/react-router'

import { requireAuthMiddleware } from '@/middlewares/require-auth-middleware'
import { ResetPasswordPage } from '@/ui/identity/widgets/pages/reset-password-page'

export const Route = createFileRoute('/redefinir-senha/')({
  beforeLoad: requireAuthMiddleware,
  component: ResetPasswordPage,
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      code: search?.code as string | undefined,
    }
  },
})
