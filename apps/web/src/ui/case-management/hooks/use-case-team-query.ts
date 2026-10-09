import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useCaseTeamQuery(caseId: string) {
  const { caseManagementService } = useRestContext()
  const queryClient = useQueryClient()
  const { currentCollaborator } = useCurrentCollaboratorQuery()

  async function fetchCaseTeam() {
    const response = await caseManagementService.getCaseTeam(caseId)

    if (response.isFailure) {
      if (response.statusCode === 403) {
        // Purge related protected data but keep this active query so React Query can
        // publish its ForbiddenError to the page instead of leaving it in loading.
        void queryClient.removeQueries({ queryKey: ['case-details', caseId] })
        void queryClient.removeQueries({ queryKey: ['case-management', 'my-cases'] })
        void queryClient.removeQueries({ queryKey: ['case-management', 'cases', caseId] })
        void queryClient.removeQueries({ queryKey: ['case-portal-access', caseId] })
        void queryClient.removeQueries({ queryKey: ['third-parties'] })
      }
      response.throwError()
    }

    return response.body
  }

  const {
    data: caseTeam = null,
    error: caseTeamError,
    isLoading: isLoadingCaseTeam,
    refetch: refetchCaseTeam,
  } = useQuery({
    queryKey: ['case-management', 'team', caseId, currentCollaborator?.collaboratorId],
    queryFn: fetchCaseTeam,
    enabled: Boolean(caseId && currentCollaborator?.collaboratorId),
    retry: false,
  })

  return {
    caseTeam,
    caseTeamError,
    isLoadingCaseTeam,
    refetchCaseTeam,
  }
}
