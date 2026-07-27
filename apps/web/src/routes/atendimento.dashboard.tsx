import { Dashboard } from '#/ui/identity/widgets/pages/attendant'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/atendimento/dashboard')({
  component: Dashboard,
})
