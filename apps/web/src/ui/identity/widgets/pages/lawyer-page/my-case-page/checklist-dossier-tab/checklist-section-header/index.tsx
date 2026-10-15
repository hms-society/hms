import type { ChecklistTabState } from '../types'
import { ChecklistSectionSummary } from '../checklist-section-summary'
import { ChecklistProgress } from '../checklist-progress'
import { ChecklistSectionActions } from '../checklist-section-actions'

export type ChecklistSectionHeaderProps = {
  readOnly: boolean
  state: ChecklistTabState
}

export const ChecklistSectionHeader = ({
  readOnly,
  state,
}: ChecklistSectionHeaderProps) => {
  return (
    <>
      <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
        <ChecklistSectionSummary state={state} />
        <ChecklistProgress state={state} />
      </div>
      {!readOnly && <ChecklistSectionActions state={state} />}
    </>
  )
}
