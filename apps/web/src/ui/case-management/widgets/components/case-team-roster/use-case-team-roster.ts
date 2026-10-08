import { useCaseTeamQuery } from '@/ui/case-management/hooks/use-case-team-query'

export function useCaseTeamRoster(caseId: string) {
  const query = useCaseTeamQuery(caseId)

  function handleRetry() {
    void query.refetchCaseTeam()
  }

  return {
    caseTeam: query.caseTeam,
    error: query.caseTeamError,
    handleRetry,
    isLoading: query.isLoadingCaseTeam,
    members: query.caseTeam?.members ?? [],
    total: query.caseTeam?.total ?? 0,
  }
}
