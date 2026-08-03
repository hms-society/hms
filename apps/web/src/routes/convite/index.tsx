import { createFileRoute } from '@tanstack/react-router'

import { CollaboratorInvitePage } from '@/ui/identity/widgets/pages/collaborator-invite-page'
import type { CollaboratorInviteSearch } from '@/ui/identity/widgets/pages/collaborator-invite-page/use-collaborator-invite-page'

export const Route = createFileRoute('/convite/')({
  component: CollaboratorInviteRoute,
  ssr: false,
  validateSearch: (search: Record<string, unknown>): CollaboratorInviteSearch => ({
    code: parseSearchString(search.code),
    error: parseSearchString(search.error),
    error_code: parseSearchString(search.error_code),
    error_description: parseSearchString(search.error_description),
  }),
})

function CollaboratorInviteRoute() {
  return <CollaboratorInvitePage inviteSearch={Route.useSearch()} />
}

function parseSearchString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : undefined
}
