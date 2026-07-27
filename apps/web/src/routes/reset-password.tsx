import { createFileRoute } from '@tanstack/react-router'
import { ResetPasswordPage } from '#/ui/identity/widgets/pages/sign-in/reset-password'

export const Route = createFileRoute('/reset-password')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      code: search?.code as string | undefined,
    }
  },
  component: ResetPasswordPage,
})
