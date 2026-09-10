import type { CollaboratorListQuery } from '@hms/core/identity/domain/structures'
import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

const COLLABORATOR_QUERY_SCOPE = 'identity'

export const COLLABORATORS_QUERY_KEY = [
  COLLABORATOR_QUERY_SCOPE,
  'collaborators',
] as const

export function getCollaboratorsQueryKey(query: CollaboratorListQuery) {
  return [
    ...COLLABORATORS_QUERY_KEY,
    'list',
    {
      search: query.search ?? '',
      profile: query.profile ?? null,
      jobTitle: query.jobTitle ?? '',
      status: query.status ?? null,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
    },
  ] as const
}

export function useCollaboratorsQuery(query: CollaboratorListQuery = {}) {
  const { identityService } = useRestContext()

  async function fetchCollaborators() {
    const response = await identityService.listCollaborators(query)

    if (response.isFailure) response.throwError()

    return response.body
  }

  const {
    data: collaboratorsPage = null,
    error: collaboratorsPageError,
    isLoading: isLoadingCollaborators,
    refetch,
  } = useQuery({
    queryKey: getCollaboratorsQueryKey(query),
    queryFn: fetchCollaborators,
  })

  return {
    collaboratorsPage,
    collaboratorsPageError,
    isLoadingCollaborators,
    refetch,
  }
}
