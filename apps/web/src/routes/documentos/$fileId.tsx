import { createFileRoute } from '@tanstack/react-router'
import { requireAuthMiddleware } from '@/middlewares/require-auth-middleware'
import { DocumentViewerPage } from '@/ui/identity/widgets/pages/document-viewer'
import { AppLayout } from '@/ui/shared/widgets/layouts/app-layout'

export const Route = createFileRoute('/documentos/$fileId')({
  beforeLoad: requireAuthMiddleware,
  component:RouteComponent
})

function RouteComponent(){
  return(
    <AppLayout>
      <DocumentViewerPage/>
    </AppLayout>
  )
}



