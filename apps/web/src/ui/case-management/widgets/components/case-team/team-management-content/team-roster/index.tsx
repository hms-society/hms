import type { RefObject } from 'react'

import { CaseTeamErrorState } from '../../case-team-error-state'
import { TeamHeader } from '../../team-header'
import { TeamMembersPanel } from '../../team-members-panel'
import type { useCaseTeam } from '../../use-case-team'

export type TeamRosterProps = {
  teamState: ReturnType<typeof useCaseTeam>
  addMemberButtonRef: RefObject<HTMLButtonElement | null>
}

export const TeamRoster = ({ teamState, addMemberButtonRef }: TeamRosterProps) => {
  return (
    <>
      <TeamHeader teamState={teamState} addMemberButtonRef={addMemberButtonRef} />
      {teamState.caseTeamError ? (
        <CaseTeamErrorState onRetry={() => void teamState.handleRetryCaseTeam()} />
      ) : (
        <TeamMembersPanel teamState={teamState} />
      )}
    </>
  )
}
