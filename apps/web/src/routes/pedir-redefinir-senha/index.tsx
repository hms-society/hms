import { createFileRoute } from '@tanstack/react-router'

import { RequestPasswordResetPage } from '@/ui/identity/widgets/pages/request-password-reset-page'

export const Route = createFileRoute('/pedir-redefinir-senha/')({
  component: RequestPasswordResetPage,
  ssr: false,
})
