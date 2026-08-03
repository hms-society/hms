import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { collaboratorQueryKeys } from '@/ui/identity/hooks/collaborator-query-keys'

export function useCollaboratorDetailsQuery(collaboratorId: string) {
  const { identityService } = useRestContext()

  async function fetchCollaborator() {
    const response = await identityService.getCollaborator(collaboratorId)

    if (response.isFailure) response.throwError()

    return response.body
  }

  const {
    data: collaborator = null,
    error: collaboratorError,
    isLoading: isLoadingCollaborator,
    refetch,
  } = useQuery({
    queryKey: collaboratorQueryKeys.detail(collaboratorId),
    queryFn: fetchCollaborator,
  })

  return {
    collaborator,
    collaboratorError,
    isLoadingCollaborator,
    refetch,
  }
}
