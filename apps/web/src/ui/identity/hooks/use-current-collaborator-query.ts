import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { collaboratorQueryKeys } from './collaborator-query-keys'

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
    queryKey: collaboratorQueryKeys.current,
    queryFn: fetchCurrentCollaborator,
  })

  return {
    currentCollaborator,
    currentCollaboratorError,
    isLoadingCurrentCollaborator,
  }
}
