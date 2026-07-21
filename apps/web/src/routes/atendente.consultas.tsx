import { AgendarConsulta } from '#/ui/identity/widgets/pages/atendente/agendar-consulta'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/atendente/consultas')({
  component: AgendarConsulta,
})


