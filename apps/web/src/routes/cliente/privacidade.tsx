import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/cliente/privacidade')({
  component: () => <div>Privacidade & LGPD</div>,
})
