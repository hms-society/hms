import type { IdentityService } from '@hms/core/identity/interfaces'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { COLLABORATORS_QUERY_KEY } from './use-collaborators-query'

type CollaboratorId = Parameters<IdentityService['deactivateCollaborator']>[0]

export function useDeactivateCollaboratorAction() {
  const queryClient = useQueryClient()
  const { identityService } = useRestContext()

  async function deactivateCollaborator(collaboratorId: CollaboratorId) {
    const response = await identityService.deactivateCollaborator(collaboratorId)

    if (response.isFailure) response.throwError()

    return response.body
  }

  function invalidateCollaborators() {
    void queryClient.invalidateQueries({ queryKey: COLLABORATORS_QUERY_KEY })
  }

  const {
    mutateAsync: deactivateCollaboratorMutation,
    isPending: isDeactivatingCollaborator,
    error: deactivateCollaboratorError,
    reset: resetDeactivateCollaborator,
  } = useMutation({
    mutationFn: deactivateCollaborator,
    onSuccess: invalidateCollaborators,
  })

  return {
    deactivateCollaborator: deactivateCollaboratorMutation,
    deactivateCollaboratorError,
    isDeactivatingCollaborator,
    resetDeactivateCollaborator,
  }
}
