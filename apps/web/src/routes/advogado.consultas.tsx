import { createFileRoute } from '@tanstack/react-router'
import { Consultation } from '#/ui/identity/widgets/pages/lawer/consultation'

export const Route = createFileRoute('/advogado/consultas')({
  component: Consultation,
})

