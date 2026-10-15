import type { ChecklistTabState } from '../types'
import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { GateActionButton } from '../gate-action-button'

export type ChecklistGateActionsProps = { state: ChecklistTabState }

export const ChecklistGateActions = ({ state }: ChecklistGateActionsProps) => (
  <div className='flex flex-wrap justify-end gap-2 lg:max-w-sm'>
    <Button
      variant='outline'
      size='xs'
      className='rounded-full border-accent bg-background text-accent-foreground hover:bg-secondary'
      disabled={
        !state.isChecklistComplete ||
        state.hasChecklistDecision ||
        state.isReviewDisabled ||
        state.isReviewingChecklistGate
      }
      onClick={state.handleApproveChecklist}
    >
      <Icon name='check' className='size-3' />
      Aprovar checklist
    </Button>
    <GateActionButton
      disabled={
        state.hasChecklistDecision ||
        state.isReviewDisabled ||
        state.isReviewingChecklistGate
      }
      icon='shield-check'
      label='Aprovar com exceção'
      onClick={state.handleApproveWithException}
    />
    <GateActionButton
      destructive
      disabled={
        state.hasChecklistDecision ||
        state.isReviewDisabled ||
        state.isReviewingChecklistGate
      }
      icon='lock'
      label='Bloqueado/insuficiente'
      onClick={state.handleBlockChecklist}
    />
    <GateActionButton
      destructive
      disabled={
        state.hasChecklistDecision ||
        state.isReviewDisabled ||
        state.isReviewingChecklistGate
      }
      icon='shield-alert'
      label='Reprovar mérito'
      onClick={state.handleRejectOnMerit}
    />
  </div>
)
