import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/cliente/mensagens')({
  component: () => <div>Mensagens</div>,
})
