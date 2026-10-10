import type { CaseTeamCandidatesQuery } from '@hms/core/case-management/domain/structures'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export type UseCaseTeamCandidatesQueryParams = CaseTeamCandidatesQuery & {
  caseId?: string
  enabled: boolean
}

export function useCaseTeamCandidatesQuery({
  caseId,
  enabled,
  page,
  pageSize,
  profile,
  search,
}: UseCaseTeamCandidatesQueryParams) {
  const { caseManagementService } = useRestContext()
  const queryClient = useQueryClient()
  const { currentCollaborator } = useCurrentCollaboratorQuery()

  async function fetchCandidates() {
    const response = await caseManagementService.listCaseTeamCandidates(
      { page, pageSize, profile, search },
      caseId,
    )

    if (response.isFailure) {
      if (response.statusCode === 403) {
        void queryClient.removeQueries({
          predicate: (query) =>
            query.queryKey[0] === 'case-management' &&
            query.queryKey[1] === 'team-candidates' &&
            query.queryKey[2] === caseId &&
            query.queryKey[3] === currentCollaborator?.collaboratorId,
        })
      }
      response.throwError()
    }

    return response.body
  }

  const {
    data: caseTeamCandidates,
    error: caseTeamCandidatesError,
    isLoading: isLoadingCaseTeamCandidates,
    refetch: refetchCaseTeamCandidates,
  } = useQuery({
    queryKey: [
      'case-management',
      'team-candidates',
      caseId,
      currentCollaborator?.collaboratorId,
      search?.trim() ?? '',
      profile ?? null,
      page,
      pageSize,
    ],
    queryFn: fetchCandidates,
    enabled: enabled && Boolean(currentCollaborator?.collaboratorId),
    placeholderData: (previousCandidates) => previousCandidates,
    retry: false,
  })

  return {
    caseTeamCandidates: caseTeamCandidates ?? null,
    caseTeamCandidatesError,
    isLoadingCaseTeamCandidates,
    refetchCaseTeamCandidates,
  }
}
