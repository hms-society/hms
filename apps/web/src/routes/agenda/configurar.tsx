import { createFileRoute } from '@tanstack/react-router'

import { Schedule } from '@/ui/identity/widgets/pages/lawyer-page/schedule'

export const Route = createFileRoute('/agenda/configurar')({
  component: Schedule,
})
