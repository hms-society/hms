import type { ChecklistTabState } from '../types'

export type GateMessagesProps = {
  disabledReason?: string
  state: ChecklistTabState
}

export const GateMessages = ({ disabledReason, state }: GateMessagesProps) => (
  <>
    {state.checklistGateRemarks && (
      <p className='mt-1 text-[14px] font-medium text-accent-foreground'>
        Ressalvas: {state.checklistGateRemarks}
      </p>
    )}
    {state.checklistGateAuditLabel && (
      <p className='mt-1 text-[14px] font-medium text-accent-foreground'>
        {state.checklistGateAuditLabel}
      </p>
    )}
    {state.error && (
      <p className='mt-1 text-[14px] font-medium text-destructive'>
        {state.error.message}
      </p>
    )}
    {state.isReviewDisabled && disabledReason && (
      <p className='mt-1 text-[14px] font-medium text-accent-foreground'>
        {disabledReason}
      </p>
    )}
    {state.actionFeedback && (
      <p className='mt-1 text-[14px] font-medium text-primary'>{state.actionFeedback}</p>
    )}
  </>
)
