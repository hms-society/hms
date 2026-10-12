import type { ChecklistTabState } from '../types'
import { ChecklistSectionHeader } from '../checklist-section-header'
import { ChecklistItems } from '../checklist-items'
import { ComplementaryItems } from '../complementary-items'

export type ChecklistSectionProps = {
  readOnly: boolean
  state: ChecklistTabState
}

export const ChecklistSection = ({ readOnly, state }: ChecklistSectionProps) => (
  <section className='flex flex-col gap-4 rounded-lg border border-border bg-secondary p-5 shadow-xs'>
    <ChecklistSectionHeader readOnly={readOnly} state={state} />
    <ChecklistItems state={state} readOnly={readOnly} />
    <ComplementaryItems state={state} readOnly={readOnly} />
  </section>
)
