import { createFileRoute } from '@tanstack/react-router'

import { Dashboard } from '@/ui/identity/widgets/pages/attendant-page/clients-management'

export const Route = createFileRoute('/atendimento/dashboard')({
  component: Dashboard,
})
