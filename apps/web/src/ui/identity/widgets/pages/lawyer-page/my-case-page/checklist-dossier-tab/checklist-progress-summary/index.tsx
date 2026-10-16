import { ChecklistProgressBar } from '../checklist-progress-bar'
import { ChecklistProgressLabel } from '../checklist-progress-label'

export type ChecklistProgressSummaryProps = {
  mandatoryItemsCount: number
  progress: number
  validatedItemsCount: number
}

export const ChecklistProgressSummary = ({
  mandatoryItemsCount,
  progress,
  validatedItemsCount,
}: ChecklistProgressSummaryProps) => (
  <div className='flex w-full max-w-56 flex-col items-end gap-1.5'>
    <ChecklistProgressBar progress={progress} />
    <ChecklistProgressLabel
      mandatoryItemsCount={mandatoryItemsCount}
      progress={progress}
      validatedItemsCount={validatedItemsCount}
    />
  </div>
)
