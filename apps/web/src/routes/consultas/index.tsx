import { createFileRoute } from '@tanstack/react-router'

import { ConsultationIndexPage } from '@/ui/consultation/widgets/pages/consultation-page'

export const Route = createFileRoute('/consultas/')({
  component: ConsultationIndexPage,
})
