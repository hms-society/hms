import { createFileRoute } from '@tanstack/react-router'

import { requireAdminMiddleware } from '@/middlewares/require-admin-middleware'
import { DocumentSpecificationPage } from '@/ui/document-production/widgets/pages/document-specification-page'
import { AppLayout } from '@/ui/shared/widgets/layouts/app-layout'

export const Route = createFileRoute('/modelos-de-documentos/novo')({
  beforeLoad: requireAdminMiddleware,
  ssr: false,
  component: NewDocumentSpecificationRoute,
})

function NewDocumentSpecificationRoute() {
  return (
    <AppLayout>
      <DocumentSpecificationPage mode='create' />
    </AppLayout>
  )
}
