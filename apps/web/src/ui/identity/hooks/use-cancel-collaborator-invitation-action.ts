import type { IdentityService } from '@hms/core/identity/interfaces'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { COLLABORATORS_QUERY_KEY } from './use-collaborators-query'

type CollaboratorId = Parameters<IdentityService['cancelCollaboratorInvitation']>[0]

export function useCancelCollaboratorInvitationAction() {
  const queryClient = useQueryClient()
  const { identityService } = useRestContext()

  async function cancelCollaboratorInvitation(collaboratorId: CollaboratorId) {
    const response = await identityService.cancelCollaboratorInvitation(collaboratorId)

    if (response.isFailure) response.throwError()

    return response.body
  }

  function invalidateCollaborators() {
    void queryClient.invalidateQueries({ queryKey: COLLABORATORS_QUERY_KEY })
  }

  const {
    mutateAsync: cancelCollaboratorInvitationMutation,
    isPending: isCancellingCollaboratorInvitation,
    error: cancelCollaboratorInvitationError,
    reset: resetCancelCollaboratorInvitation,
  } = useMutation({
    mutationFn: cancelCollaboratorInvitation,
    onSuccess: invalidateCollaborators,
  })

  return {
    cancelCollaboratorInvitation: cancelCollaboratorInvitationMutation,
    cancelCollaboratorInvitationError,
    isCancellingCollaboratorInvitation,
    resetCancelCollaboratorInvitation,
  }
}
