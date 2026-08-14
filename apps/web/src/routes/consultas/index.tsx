import { createFileRoute } from '@tanstack/react-router'

import { Consultation } from '@/ui/identity/widgets/pages/lawyer-page/consultation'

export const Route = createFileRoute('/consultas/')({
  component: Consultation,
})

