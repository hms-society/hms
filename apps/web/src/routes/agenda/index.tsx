import { createFileRoute, redirect } from '@tanstack/react-router'
import { Schedule } from '@/ui/identity/widgets/pages/lawyer-page/schedule'

export const Route = createFileRoute('/agenda/')({
  beforeLoad: () => {
    throw redirect({ to: '/agenda/consultas' })
  },
  component: Schedule,
})
