import type { CollaboratorUpdate } from '@hms/core/identity/domain/entities'
import type { IdentityService } from '@hms/core/identity/interfaces'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { COLLABORATORS_QUERY_KEY } from './use-collaborators-query'

type UpdateCollaboratorRequest = {
  collaboratorId: Parameters<IdentityService['updateCollaborator']>[0]
  changes: CollaboratorUpdate
}

export function useUpdateCollaboratorAction() {
  const queryClient = useQueryClient()
  const { identityService } = useRestContext()

  async function updateCollaboratorRequest({
    collaboratorId,
    changes,
  }: UpdateCollaboratorRequest) {
    const response = await identityService.updateCollaborator(collaboratorId, changes)

    if (response.isFailure) response.throwError()

    return response.body
  }

  function invalidateCollaborators() {
    void queryClient.invalidateQueries({ queryKey: COLLABORATORS_QUERY_KEY })
  }

  const {
    mutateAsync: updateCollaborator,
    isPending: isUpdatingCollaborator,
    error: updateCollaboratorError,
  } = useMutation({
    mutationFn: updateCollaboratorRequest,
    onSuccess: invalidateCollaborators,
  })

  return {
    updateCollaboratorError,
    isUpdatingCollaborator,
    updateCollaborator,
  }
}
