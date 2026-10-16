import type { ChecklistTabState } from '../types'
import { ChecklistProgressSummary } from '../checklist-progress-summary'
import { useChecklistProgress } from './use-checklist-progress'

export type ChecklistProgressProps = { state: ChecklistTabState }

export const ChecklistProgress = ({ state }: ChecklistProgressProps) => (
  <ChecklistProgressSummary
    mandatoryItemsCount={state.mandatoryItemsCount}
    progress={useChecklistProgress(state).progress}
    validatedItemsCount={state.validatedItemsCount}
  />
)
