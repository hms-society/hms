import type { ChecklistTabState } from '../types'
import { DecisionReasonDialog } from '../decision-reason-dialog'

export type DecisionReasonSectionProps = { state: ChecklistTabState }

export const DecisionReasonSection = ({ state }: DecisionReasonSectionProps) => (
  <DecisionReasonDialog
    confirmLabel={state.decisionReasonDialog.confirmLabel}
    description={state.decisionReasonDialog.description}
    error={state.reasonError}
    isConfirming={state.isReviewingChecklistGate}
    open={state.isDecisionReasonDialogOpen}
    reason={state.remarks}
    title={state.decisionReasonDialog.title}
    onCancel={state.handleCancelDecisionReason}
    onConfirm={state.handleConfirmDecisionReason}
    onOpenChange={state.handleDecisionReasonDialogOpenChange}
    onReasonChange={state.handleRemarksChange}
  />
)
