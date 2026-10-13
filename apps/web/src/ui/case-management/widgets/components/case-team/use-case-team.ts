import { useRef } from 'react'
import { LegalCaseStatus } from '@hms/core/case-management/domain/structures'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { useCaseTeamQuery } from '@/ui/case-management/hooks/use-case-team-query'
import { useCaseTeamMutation } from './use-case-team-mutation'

export function useCaseTeam(caseId: string) {
  const query = useCaseTeamQuery(caseId)
  const addMemberButtonRef = useRef<HTMLButtonElement>(null)

  return {
    addMemberButtonRef,
    ...useCaseTeamMutation(caseId, query.caseTeam ?? undefined, query.refetchCaseTeam),
    ...getCaseTeamViewState(query),
  }
}

/** Adapts query fields to the stable state exposed by the team widget. */
function getCaseTeamViewState({
  caseTeam,
  caseTeamError,
  isLoadingCaseTeam,
  refetchCaseTeam,
}: ReturnType<typeof useCaseTeamQuery>) {
  // Permission state is derived separately so query loading and errors stay intact.
  return {
    ...getTeamPermissions(caseTeam),
    caseTeam,
    caseTeamError,
    isLoadingCaseTeam,
    handleRetryCaseTeam: refetchCaseTeam,
    formatDate: formatCaseTeamDate,
  }
}

function getTeamPermissions(caseTeam: ReturnType<typeof useCaseTeamQuery>['caseTeam']) {
  const isClosed = caseTeam?.status === LegalCaseStatus.Closed
  return { isClosed, canManageTeam: Boolean(caseTeam?.canManage && !isClosed) }
}

function formatCaseTeamDate(value: Date | string) {
  return format(new Date(value), "d 'de' MMM 'de' yyyy", { locale: ptBR })
}
