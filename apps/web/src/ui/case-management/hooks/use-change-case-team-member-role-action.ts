import type { CaseManagementService as ICaseManagementService } from '@hms/core/case-management/interfaces'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

type ChangeCaseTeamMemberRoleRequest = Parameters<
  ICaseManagementService['changeCaseTeamMemberRole']
>[2]

export const useChangeCaseTeamMemberRoleAction = (caseId: string) => {
  const queryClient = useQueryClient()
  const { caseManagementService } = useRestContext()

  async function changeCaseTeamMemberRole({
    membershipId,
    request,
  }: {
    membershipId: string
    request: ChangeCaseTeamMemberRoleRequest
  }) {
    const response = await caseManagementService.changeCaseTeamMemberRole(
      caseId,
      membershipId,
      request,
    )

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
    mutateAsync: changeCaseTeamMemberRoleMutation,
    isPending: isChangingCaseTeamMemberRole,
    error: changeCaseTeamMemberRoleError,
    reset: resetChangeCaseTeamMemberRole,
  } = useMutation({
    mutationFn: changeCaseTeamMemberRole,
    onSuccess: invalidateCaseTeam,
  })

  return {
    changeCaseTeamMemberRole: changeCaseTeamMemberRoleMutation,
    changeCaseTeamMemberRoleError,
    isChangingCaseTeamMemberRole,
    resetChangeCaseTeamMemberRole,
  }
}
