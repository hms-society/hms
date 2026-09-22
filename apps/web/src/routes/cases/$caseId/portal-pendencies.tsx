import { createFileRoute } from '@tanstack/react-router'

import { PortalDocumentsPage } from '@/ui/case-management/widgets/pages/portal-documents-page'

type PortalDocumentsSearch = {
  portalToken?: string
}

export const Route = createFileRoute('/cases/$caseId/portal-pendencies')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): PortalDocumentsSearch => ({
    portalToken: typeof search.portalToken === 'string' ? search.portalToken : undefined,
  }),
})

function RouteComponent() {
  const { caseId } = Route.useParams()
  const { portalToken } = Route.useSearch()

  if (!portalToken) {
    return (
      <main className='flex min-h-screen items-center justify-center bg-background px-4 py-8'>
        <p className='font-sans text-sm text-muted-foreground'>Link do portal incompleto.</p>
      </main>
    )
  }

  return <PortalDocumentsPage caseId={caseId} portalToken={portalToken} />
}
