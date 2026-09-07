import { createFileRoute } from '@tanstack/react-router'
import { DocumentInboxPage } from '@/ui/document-engine/widgets/pages/document-inbox'
import { AppLayout } from '@/ui/shared/widgets/layouts/app-layout'

type DocumentInboxSearch = {
  caseId?: string
}

export const Route = createFileRoute('/caixa-de-documentos/')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): DocumentInboxSearch => ({
    caseId: typeof search.caseId === 'string' ? search.caseId : undefined,
  }),
})

function RouteComponent() {
  const { caseId } = Route.useSearch()

  return (
    <AppLayout>
      <DocumentInboxPage caseId={caseId} />
    </AppLayout>
  )
}
