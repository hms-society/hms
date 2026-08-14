import { createFileRoute } from '@tanstack/react-router'

import { ConsultationPage } from '@/ui/identity/widgets/pages/lawyer-page/consultation-page'

export const Route = createFileRoute('/advogado/consultas')({
  component: ConsultationPage,
})
