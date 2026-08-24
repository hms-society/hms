import type { IdentityService } from '@hms/core/identity/interfaces'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { COLLABORATORS_QUERY_KEY } from './use-collaborators-query'

type CollaboratorId = Parameters<IdentityService['reactivateCollaborator']>[0]

export function useReactivateCollaboratorAction() {
  const queryClient = useQueryClient()
  const { identityService } = useRestContext()

  async function reactivateCollaborator(collaboratorId: CollaboratorId) {
    const response = await identityService.reactivateCollaborator(collaboratorId)

    if (response.isFailure) response.throwError()

    return response.body
  }

  function invalidateCollaborators() {
    void queryClient.invalidateQueries({ queryKey: COLLABORATORS_QUERY_KEY })
  }

  const {
    mutateAsync: reactivateCollaboratorMutation,
    isPending: isReactivatingCollaborator,
    error: reactivateCollaboratorError,
    reset: resetReactivateCollaborator,
  } = useMutation({
    mutationFn: reactivateCollaborator,
    onSuccess: invalidateCollaborators,
  })

  return {
    reactivateCollaborator: reactivateCollaboratorMutation,
    reactivateCollaboratorError,
    isReactivatingCollaborator,
    resetReactivateCollaborator,
  }
}
