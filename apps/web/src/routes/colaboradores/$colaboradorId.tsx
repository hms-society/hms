import { createFileRoute } from '@tanstack/react-router'

import { requireAdminMiddleware } from '@/middlewares/require-admin-middleware'
import { CollaboratorDetailsPage } from '@/ui/identity/widgets/pages/collaborator-details-page'
import { AppLayout } from '@/ui/shared/widgets/layouts/app-layout'

export const Route = createFileRoute('/colaboradores/$colaboradorId')({
  beforeLoad: requireAdminMiddleware,
  component: CollaboratorDetailsRoute,
  ssr: false,
})

function CollaboratorDetailsRoute() {
  const { colaboradorId } = Route.useParams()

  return (
    <AppLayout>
      <CollaboratorDetailsPage collaboratorId={colaboradorId} />
    </AppLayout>
  )
}
