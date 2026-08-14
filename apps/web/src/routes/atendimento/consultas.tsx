import { ConsultationPage } from '@/ui/identity/widgets/pages/lawyer-page/consultation-page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/atendimento/consultas')({
  component: () => <ConsultationPage />, 
})
