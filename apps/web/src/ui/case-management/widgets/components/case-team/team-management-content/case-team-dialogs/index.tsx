import type { RefObject } from 'react'

import { CaseTeamMemberSelector } from '../../../case-team-member-selector'
import { TeamMutationDialog } from '../../team-mutation-dialog'
import type { useCaseTeam } from '../../use-case-team'

export type CaseTeamDialogsProps = {
  caseId: string
  teamState: ReturnType<typeof useCaseTeam>
  addMemberButtonRef: RefObject<HTMLButtonElement | null>
}

export const CaseTeamDialogs = ({
  caseId,
  teamState,
  addMemberButtonRef,
}: CaseTeamDialogsProps) => (
  <>
    <CaseTeamMemberSelector
      open={teamState.isSelectorOpen}
      caseId={caseId}
      triggerRef={addMemberButtonRef}
      onClose={teamState.handleCloseSelector}
      onSelect={teamState.handleSelectCandidate}
    />
    <TeamMutationDialog
      caseTeam={teamState.caseTeam ?? undefined}
      mutation={teamState.pendingMutation}
      reason={teamState.reason}
      error={teamState.mutationError}
      hasVersionConflict={teamState.hasVersionConflict}
      isPending={teamState.isMutationPending}
      onOpenChange={teamState.handlePendingMutationOpenChange}
      onReasonChange={teamState.handleReasonChange}
      onConfirm={() => void teamState.handleConfirmMutation()}
    />
  </>
)
