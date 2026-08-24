import type { IdentityService } from '@hms/core/identity/interfaces'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { COLLABORATORS_QUERY_KEY } from './use-collaborators-query'

type CollaboratorId = Parameters<IdentityService['removeCollaborator']>[0]

export function useRemoveCollaboratorAction() {
  const queryClient = useQueryClient()
  const { identityService } = useRestContext()

  async function removeCollaborator(collaboratorId: CollaboratorId) {
    const response = await identityService.removeCollaborator(collaboratorId)

    if (response.isFailure) response.throwError()
  }

  function invalidateCollaborators() {
    void queryClient.invalidateQueries({ queryKey: COLLABORATORS_QUERY_KEY })
  }

  const {
    mutateAsync: removeCollaboratorMutation,
    isPending: isRemovingCollaborator,
    error: removeCollaboratorError,
    reset: resetRemoveCollaborator,
  } = useMutation({
    mutationFn: removeCollaborator,
    onSuccess: invalidateCollaborators,
  })

  return {
    removeCollaborator: removeCollaboratorMutation,
    removeCollaboratorError,
    isRemovingCollaborator,
    resetRemoveCollaborator,
  }
}
