import { createFileRoute } from '@tanstack/react-router'

import { requireProfessionalProfileReaderMiddleware } from '@/middlewares/require-professional-profile-reader-middleware'
import { CollaboratorDetailsPage } from '@/ui/identity/widgets/pages/collaborator-details-page'
import { AppLayout } from '@/ui/shared/widgets/layouts/app-layout'
import { CollaboratorProfile } from '@hms/core/identity/domain/structures'
import { CollaboratorProfessionalProfilePage } from '@/ui/identity/widgets/pages/collaborator-professional-profile-page'
import { RouteAccessError } from '@/ui/shared/widgets/components/route-access-error'

export const Route = createFileRoute('/colaboradores/$colaboradorId')({
  beforeLoad: requireProfessionalProfileReaderMiddleware,
  component: CollaboratorDetailsRoute,
  errorComponent: RouteAccessError,
  ssr: false,
})

function CollaboratorDetailsRoute() {
  const { colaboradorId } = Route.useParams()
  const { currentCollaborator } = Route.useRouteContext()

  return (
    <AppLayout>
      {currentCollaborator.profile === CollaboratorProfile.Admin ? (
        <CollaboratorDetailsPage collaboratorId={colaboradorId} />
      ) : (
        <CollaboratorProfessionalProfilePage collaboratorId={colaboradorId} />
      )}
    </AppLayout>
  )
}
