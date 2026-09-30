import { ConsultationIndexPage } from '@/ui/consultation/widgets/pages/consultation-page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/atendimento/consultas')({
  component: ConsultationIndexPage,
})
