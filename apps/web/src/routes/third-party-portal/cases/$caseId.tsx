import { createFileRoute } from '@tanstack/react-router'

import { PortalDocumentsPage } from '@/ui/case-management/widgets/pages/portal-documents-page'

type ThirdPartyPortalSearch = {
  portalToken?: string
}

export const Route = createFileRoute('/third-party-portal/cases/$caseId')({
  component: ThirdPartyPortalCaseRoute,
  validateSearch: (search: Record<string, unknown>): ThirdPartyPortalSearch => ({
    portalToken: typeof search.portalToken === 'string' ? search.portalToken : undefined,
  }),
})

function ThirdPartyPortalCaseRoute() {
  const { caseId } = Route.useParams()
  const { portalToken } = Route.useSearch()

  if (!portalToken) {
    return (
      <main className='flex min-h-screen items-center justify-center bg-background px-4 py-8'>
        <section className='w-full max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-card'>
          <h1 className='font-serif text-xl font-semibold text-brand'>
            Link do portal incompleto
          </h1>
          <p className='mt-2 font-sans text-sm text-muted-foreground'>
            Solicite um novo link de acesso ao responsável pelo caso.
          </p>
        </section>
      </main>
    )
  }

  return <PortalDocumentsPage caseId={caseId} portalToken={portalToken} />
}
