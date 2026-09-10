import { createFileRoute } from '@tanstack/react-router'
import ChecklistsTemplatesPage from '@/ui/identity/widgets/pages/checklists-templates'
import { AppLayout } from '@/ui/shared/widgets/layouts/app-layout'

export const Route = createFileRoute('/checklists/templates/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <AppLayout>
      <ChecklistsTemplatesPage/>
    </AppLayout>
  )
}
