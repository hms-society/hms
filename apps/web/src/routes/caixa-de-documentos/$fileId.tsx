import { createFileRoute } from '@tanstack/react-router'
import { AppLayout } from '@/ui/shared/widgets/layouts/app-layout'
import { DocumentAnalysisPage } from '@/ui/document-engine/widgets/pages/document-analysis-page'

type DocumentAnalysisSearch = {
  fromCaseId?: string
}

export const Route = createFileRoute('/caixa-de-documentos/$fileId')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): DocumentAnalysisSearch => ({
    fromCaseId:
      typeof search.fromCaseId === 'string' ? search.fromCaseId : undefined,
  }),
})

function RouteComponent() {
  const { fileId } = Route.useParams()
  const { fromCaseId } = Route.useSearch()

  return (
    <AppLayout>
      <DocumentAnalysisPage fileId={fileId} fromCaseId={fromCaseId} />
    </AppLayout>
  )
}
