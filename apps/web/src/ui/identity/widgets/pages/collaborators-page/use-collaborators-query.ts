import type { CollaboratorListQuery } from '@hms/core/identity/domain/structures'
import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { collaboratorQueryKeys } from '@/ui/identity/hooks/collaborator-query-keys'

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
    queryKey: collaboratorQueryKeys.list(query),
    queryFn: fetchCollaborators,
  })

  return {
    collaboratorsPage,
    collaboratorsPageError,
    isLoadingCollaborators,
    refetch,
  }
}

export function useCollaboratorJobTitlesQuery() {
  const { identityService } = useRestContext()

  async function fetchCollaboratorJobTitles() {
    const response = await identityService.listCollaboratorJobTitles()

    if (response.isFailure) response.throwError()

    return response.body
  }

  const {
    data: jobTitles = null,
    error: jobTitlesError,
    isLoading: isLoadingJobTitles,
  } = useQuery({
    queryKey: collaboratorQueryKeys.jobTitles,
    queryFn: fetchCollaboratorJobTitles,
  })

  return { jobTitles, jobTitlesError, isLoadingJobTitles }
}
