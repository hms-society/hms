import { useCaseTeam } from './use-case-team'
import { TeamManagementContent } from './team-management-content'

export type CaseTeamProps = {
  caseId: string
}

export const CaseTeam = ({ caseId }: CaseTeamProps) => {
  const { addMemberButtonRef, ...teamState } = useCaseTeam(caseId)

  return (
    <TeamManagementContent
      caseId={caseId}
      teamState={{ ...teamState, addMemberButtonRef }}
      addMemberButtonRef={addMemberButtonRef}
    />
  )
}
