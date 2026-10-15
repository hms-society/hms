import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useAdminCaseSummaryPage(caseId: string) {
  const { caseManagementService } = useRestContext()
  const { currentCollaborator } = useCurrentCollaboratorQuery()
  const queryClient = useQueryClient()
  const queryKey = [
    'case-management',
    'admin-summary',
    caseId,
    currentCollaborator?.collaboratorId,
  ]
  return useQuery({
    queryKey,
    enabled: Boolean(caseId && currentCollaborator?.collaboratorId),
    retry: false,
    queryFn: async () => {
      const response = await caseManagementService.getLegalCaseDetails(caseId)
      if (response.isFailure) {
        if (response.statusCode === 403) queryClient.setQueryData(queryKey, null)
        response.throwError()
      }
      return response.body
    },
  })
}
