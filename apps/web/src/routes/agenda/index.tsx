import { createFileRoute } from '@tanstack/react-router'
import { MyAgendaPage } from '@/ui/identity/widgets/pages/lawyer-page/my-agenda-page'

export const Route = createFileRoute('/agenda/')({
  component: MyAgendaPage,
})
