import { createFileRoute } from '@tanstack/react-router'

import { NovoIntake } from '@/ui/identity/widgets/pages/attendant-page/new-intake'

export const Route = createFileRoute('/atendimento/consultas')({
  component: NovoIntake,
})
