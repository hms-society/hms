import { createFileRoute } from '@tanstack/react-router'
import { DocumentInboxPage } from '@/ui/identity/widgets/pages/document-validation/document-inbox'
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
