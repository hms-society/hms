import { createFileRoute } from '@tanstack/react-router'
import { DocumentInboxPage } from '@/ui/document-engine/widgets/pages/document-inbox'
import { AppLayout } from '@/ui/shared/widgets/layouts/app-layout'

export const Route = createFileRoute('/caixa-de-documentos/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <AppLayout>
      <DocumentInboxPage />
    </AppLayout>
  )
}
