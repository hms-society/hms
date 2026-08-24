import { createFileRoute } from '@tanstack/react-router'
import { AppLayout } from '@/ui/shared/widgets/layouts/app-layout'
import { DocumentAnalysisPage } from '@/ui/document-engine/widgets/pages/document-analysis-page'

export const Route = createFileRoute('/caixa-de-documentos/$fileId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { fileId } = Route.useParams()

  return (
    <AppLayout>
      <DocumentAnalysisPage fileId={fileId} />
    </AppLayout>
  )
}
