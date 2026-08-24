import type { IdentityService } from '@hms/core/identity/interfaces'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { COLLABORATORS_QUERY_KEY } from './use-collaborators-query'

type RegisterCollaboratorRequest = Parameters<IdentityService['registerCollaborator']>[0]

export function useRegisterCollaboratorAction() {
  const queryClient = useQueryClient()
  const { identityService } = useRestContext()

  async function registerCollaboratorRequest(request: RegisterCollaboratorRequest) {
    const response = await identityService.registerCollaborator(request)

    if (response.isFailure) {
      response.throwError()
    }

    return response.body
  }

  function invalidateCollaborators() {
    void queryClient.invalidateQueries({ queryKey: COLLABORATORS_QUERY_KEY })
  }

  const {
    mutateAsync: registerCollaborator,
    isPending: isRegisteringCollaborator,
    error: registerCollaboratorError,
  } = useMutation({
    mutationFn: registerCollaboratorRequest,
    onSuccess: invalidateCollaborators,
  })

  return {
    registerCollaboratorError,
    isRegisteringCollaborator,
    registerCollaborator,
  }
}
