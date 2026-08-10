import { createFileRoute } from '@tanstack/react-router'

import { ClientsListPage } from '@/ui/identity/widgets/pages/intake-client-procedures/clients-management'

export const Route = createFileRoute('/atendimento/dashboard')({
  component: ClientsListPage,
})
