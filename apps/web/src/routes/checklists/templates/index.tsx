import { createFileRoute } from '@tanstack/react-router'
import { requireAdminMiddleware } from '@/middlewares/require-admin-middleware'
import ChecklistsTemplatesPage from '@/ui/identity/widgets/pages/checklists-templates'
import { AppLayout } from '@/ui/shared/widgets/layouts/app-layout'

export const Route = createFileRoute('/checklists/templates/')({
  beforeLoad: requireAdminMiddleware,
  validateSearch: parseChecklistTemplatesSearch,
  component: RouteComponent,
})

export function parseChecklistTemplatesSearch(search: Record<string, unknown>) {
  return {
    legalAreaId: typeof search.legalAreaId === 'string' ? search.legalAreaId : undefined,
  }
}

function RouteComponent() {
  const { legalAreaId } = Route.useSearch()

  return (
    <AppLayout>
      <ChecklistsTemplatesPage initialAreaId={legalAreaId} />
    </AppLayout>
  )
}
