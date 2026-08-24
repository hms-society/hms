import type { IdentityService } from '@hms/core/identity/interfaces'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { COLLABORATORS_QUERY_KEY } from './use-collaborators-query'

type CollaboratorId = Parameters<IdentityService['resendCollaboratorInvitation']>[0]

export function useResendCollaboratorInvitationAction() {
  const queryClient = useQueryClient()
  const { identityService } = useRestContext()

  async function resendCollaboratorInvitation(collaboratorId: CollaboratorId) {
    const response = await identityService.resendCollaboratorInvitation(collaboratorId)

    if (response.isFailure) response.throwError()

    return response.body
  }

  function invalidateCollaborators() {
    void queryClient.invalidateQueries({ queryKey: COLLABORATORS_QUERY_KEY })
  }

  const {
    mutateAsync: resendInvitation,
    isPending: isResendingInvitation,
    error: resendInvitationError,
    reset: resetResendInvitation,
  } = useMutation({
    mutationFn: resendCollaboratorInvitation,
    onSuccess: invalidateCollaborators,
  })

  return {
    resendInvitation,
    resendInvitationError,
    isResendingInvitation,
    resetResendInvitation,
  }
}
