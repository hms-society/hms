import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

const CURRENT_COLLABORATOR_QUERY_KEY = ['identity', 'collaborator', 'current'] as const

export function useCurrentCollaboratorQuery() {
  const { identityService } = useRestContext()

  async function fetchCurrentCollaborator() {
    const response = await identityService.getCurrentCollaborator()

    if (response.isFailure) response.throwError()

    return response.body
  }

  const {
    data: currentCollaborator = null,
    error: currentCollaboratorError,
    isLoading: isLoadingCurrentCollaborator,
  } = useQuery({
    queryKey: CURRENT_COLLABORATOR_QUERY_KEY,
    queryFn: fetchCurrentCollaborator,
  })

  return {
    currentCollaborator,
    currentCollaboratorError,
    isLoadingCurrentCollaborator,
  }
}
