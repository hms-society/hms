import type { CaseManagementService as ICaseManagementService } from '@hms/core/case-management/interfaces'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

type RemoveCaseTeamMemberRequest = Parameters<
  ICaseManagementService['removeCaseTeamMember']
>[2]

export const useRemoveCaseTeamMemberAction = (caseId: string) => {
  const queryClient = useQueryClient()
  const { caseManagementService } = useRestContext()

  async function removeCaseTeamMember({
    membershipId,
    request,
  }: {
    membershipId: string
    request: RemoveCaseTeamMemberRequest
  }) {
    const response = await caseManagementService.removeCaseTeamMember(
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
    mutateAsync: removeCaseTeamMemberMutation,
    isPending: isRemovingCaseTeamMember,
    error: removeCaseTeamMemberError,
    reset: resetRemoveCaseTeamMember,
  } = useMutation({
    mutationFn: removeCaseTeamMember,
    onSuccess: invalidateCaseTeam,
  })

  return {
    removeCaseTeamMember: removeCaseTeamMemberMutation,
    removeCaseTeamMemberError,
    isRemovingCaseTeamMember,
    resetRemoveCaseTeamMember,
  }
}
