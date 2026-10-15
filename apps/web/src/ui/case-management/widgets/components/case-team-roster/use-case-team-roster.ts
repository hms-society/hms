import { LegalCaseStatus } from '@hms/core/case-management/domain/structures'

import { useCaseTeamQuery } from '@/ui/case-management/hooks/use-case-team-query'
import { useCaseTeamMutation } from '@/ui/case-management/widgets/components/case-team/use-case-team-mutation'

export function useCaseTeamRoster(caseId: string) {
  const query = useCaseTeamQuery(caseId)
  const caseTeam = query.caseTeam ?? undefined
  const mutation = useCaseTeamMutation(caseId, caseTeam, query.refetchCaseTeam)
  const canManageTeam = Boolean(
    !query.caseTeamError &&
      caseTeam?.canManage &&
      caseTeam.status !== LegalCaseStatus.Closed,
  )

  function handleRetry() {
    void query.refetchCaseTeam()
  }

  return {
    caseTeam: query.caseTeam,
    canManageActiveTeam: canManageTeam,
    error: query.caseTeamError,
    ...mutation,
    handleRetry,
    isLoading: query.isLoadingCaseTeam,
    members: query.caseTeam?.members ?? [],
    total: query.caseTeam?.total ?? 0,
  }
}
