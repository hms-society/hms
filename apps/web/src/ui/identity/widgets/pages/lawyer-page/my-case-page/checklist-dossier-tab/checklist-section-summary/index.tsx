import type { ChecklistTabState } from '../types'
import { ChecklistSectionStatus } from '../checklist-section-status'
import { useChecklistSectionSummary } from './use-checklist-section-summary'
import { ChecklistItemCount } from '../checklist-item-count'

export type ChecklistSectionSummaryProps = { state: ChecklistTabState }

export const ChecklistSectionSummary = ({ state }: ChecklistSectionSummaryProps) => (
  <div className='flex flex-col gap-1'>
    <ChecklistSectionStatus status={useChecklistSectionSummary(state).status} />
    <ChecklistItemCount count={state.mandatoryItemsCount} />
  </div>
)
