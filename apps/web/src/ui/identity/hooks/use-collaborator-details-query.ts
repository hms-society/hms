import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

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
    queryKey: ['identity', 'collaborator', collaboratorId],
    queryFn: fetchCollaborator,
  })

  return {
    collaborator,
    collaboratorError,
    isLoadingCollaborator,
    refetch,
  }
}
