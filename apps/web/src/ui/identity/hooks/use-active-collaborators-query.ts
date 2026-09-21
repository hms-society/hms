import type { CollaboratorListQuery } from '@hms/core/identity/domain/structures'
import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

const COLLABORATOR_QUERY_SCOPE = 'identity'

export const ACTIVE_COLLABORATORS_QUERY_KEY = [
  COLLABORATOR_QUERY_SCOPE,
  'active-collaborators',
] as const

export function getActiveCollaboratorsQueryKey(query: CollaboratorListQuery) {
  return [
    ...ACTIVE_COLLABORATORS_QUERY_KEY,
    'list',
    {
      search: query.search ?? '',
      profile: query.profile ?? null,
      jobTitle: query.jobTitle ?? '',
      status: query.status ?? null,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 50,
    },
  ] as const
}

export function useActiveCollaboratorsQuery(query: CollaboratorListQuery = {}) {
  const { identityService } = useRestContext()

  async function fetchActiveCollaborators() {
    const response = await identityService.listActiveCollaborators(query)

    if (response.isFailure) response.throwError()

    return response.body
  }

  const {
    data: collaboratorsPage = null,
    error: collaboratorsPageError,
    isLoading: isLoadingCollaborators,
    refetch,
  } = useQuery({
    queryKey: getActiveCollaboratorsQueryKey(query),
    queryFn: fetchActiveCollaborators,
  })

  return {
    collaboratorsPage,
    collaboratorsPageError,
    isLoadingCollaborators,
    refetch,
  }
}
