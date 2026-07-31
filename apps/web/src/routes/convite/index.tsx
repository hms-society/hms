import { createFileRoute } from '@tanstack/react-router'

import { CollaboratorInvitePage } from '@/ui/identity/widgets/pages/collaborator-invite-page'

export const Route = createFileRoute('/convite/')({
  component: CollaboratorInvitePage,
  ssr: false,
})
