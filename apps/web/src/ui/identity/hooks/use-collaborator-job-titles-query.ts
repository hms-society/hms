import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

const COLLABORATOR_JOB_TITLES_QUERY_KEY = [
  'identity',
  'collaborators',
  'job-titles',
] as const

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
    queryKey: COLLABORATOR_JOB_TITLES_QUERY_KEY,
    queryFn: fetchCollaboratorJobTitles,
  })

  return { jobTitles, jobTitlesError, isLoadingJobTitles }
}
