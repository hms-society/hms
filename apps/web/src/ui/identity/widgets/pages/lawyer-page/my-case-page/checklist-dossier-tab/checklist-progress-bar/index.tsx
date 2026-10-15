export type ChecklistProgressBarProps = { progress: number }

export const ChecklistProgressBar = ({ progress }: ChecklistProgressBarProps) => (
  <div className='h-1.5 w-full overflow-hidden rounded-full bg-muted'>
    <div className='h-full rounded-full bg-primary' style={{ width: `${progress}%` }} />
  </div>
)
