import type { CaseManagementService as ICaseManagementService } from '@hms/core/case-management/interfaces'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

type AddCaseTeamMemberRequest = Parameters<ICaseManagementService['addCaseTeamMember']>[1]

export const useAddCaseTeamMemberAction = (caseId: string) => {
  const queryClient = useQueryClient()
  const { caseManagementService } = useRestContext()

  async function addCaseTeamMember(request: AddCaseTeamMemberRequest) {
    const response = await caseManagementService.addCaseTeamMember(caseId, request)

    if (response.isFailure) {
      if (response.statusCode === 403) clearCaseData()
      response.throwError()
    }

    return response.body
  }

  function clearCaseData() {
    void queryClient.removeQueries({
      predicate: (query) =>
        query.queryKey[0] === 'case-management' && query.queryKey.includes(caseId),
    })
    void queryClient.removeQueries({ queryKey: ['case-details', caseId] })
  }

  function invalidateCaseTeam() {
    void queryClient.invalidateQueries({
      queryKey: ['case-management', 'team', caseId],
    })
    void queryClient.invalidateQueries({
      queryKey: ['case-management', 'team-history', caseId],
    })
    void queryClient.invalidateQueries({ queryKey: ['case-details', caseId] })
    void queryClient.invalidateQueries({
      queryKey: ['case-management', 'my-cases'],
    })
  }

  const {
    mutateAsync: addCaseTeamMemberMutation,
    isPending: isAddingCaseTeamMember,
    error: addCaseTeamMemberError,
    reset: resetAddCaseTeamMember,
  } = useMutation({
    mutationFn: addCaseTeamMember,
    onSuccess: invalidateCaseTeam,
  })

  return {
    addCaseTeamMember: addCaseTeamMemberMutation,
    addCaseTeamMemberError,
    isAddingCaseTeamMember,
    resetAddCaseTeamMember,
  }
}
