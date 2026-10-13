import type { RefObject } from 'react'

import type { useCaseTeam } from '../use-case-team'
import { CaseTeamDialogs } from './case-team-dialogs'
import { TeamRoster } from './team-roster'

export type TeamManagementContentProps = {
  caseId: string
  teamState: ReturnType<typeof useCaseTeam>
  addMemberButtonRef: RefObject<HTMLButtonElement | null>
}

export const TeamManagementContent = ({
  caseId,
  teamState,
  addMemberButtonRef,
}: TeamManagementContentProps) => {
  return (
    <section className='space-y-4' aria-labelledby='case-team-title'>
      <TeamRoster teamState={teamState} addMemberButtonRef={addMemberButtonRef} />

      <CaseTeamDialogs
        caseId={caseId}
        teamState={teamState}
        addMemberButtonRef={addMemberButtonRef}
      />
    </section>
  )
}
