import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/cliente/meus-casos')({
  component: () => <div>Meus Casos</div>,
})
