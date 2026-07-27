import { NovoIntake } from '#/ui/identity/widgets/pages/attendant/new-intake'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/atendimento/consultas')({
  component: NovoIntake,
})


