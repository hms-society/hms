import { Dashboard } from '#/ui/identity/widgets/pages/atendente'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/atendente/dashboard')({
  component: Dashboard,
})

