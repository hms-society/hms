import type { CollaboratorUpdate } from '@hms/core/identity/domain/entities'
import type { IdentityService } from '@hms/core/identity/interfaces'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { collaboratorQueryKeys } from '@/ui/identity/hooks/collaborator-query-keys'

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

  function invalidateCollaboratorQueries(
    _collaborator: unknown,
    request: UpdateCollaboratorRequest,
  ) {
    void queryClient.invalidateQueries({ queryKey: collaboratorQueryKeys.all })
    void queryClient.invalidateQueries({
      queryKey: collaboratorQueryKeys.detail(request.collaboratorId),
    })
  }

  const {
    mutateAsync: updateCollaborator,
    isPending: isUpdatingCollaborator,
    error: updateCollaboratorError,
  } = useMutation({
    mutationFn: updateCollaboratorRequest,
    onSuccess: invalidateCollaboratorQueries,
  })

  return {
    updateCollaboratorError,
    isUpdatingCollaborator,
    updateCollaborator,
  }
}
