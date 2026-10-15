import { Icon } from '@/ui/shared/widgets/components/icon'

export type ClosureMilestoneProps = {
  title: string
  date: string
  detail: string
  complete: boolean
}

export const ClosureMilestone = ({
  title,
  date,
  detail,
  complete,
}: ClosureMilestoneProps) => (
  <div className='relative flex flex-col items-center text-center'>
    <div
      className={`flex size-11 items-center justify-center rounded-full ${complete ? 'bg-primary text-primary-foreground' : 'border border-border bg-muted/30 text-muted-foreground'}`}
    >
      <Icon name={complete ? 'check' : 'circle'} className='size-4' />
    </div>
    <p className='mt-2 text-xs font-semibold text-foreground'>{title}</p>
    <p className='text-sm font-semibold text-foreground'>{date}</p>
    <p className='text-xs text-muted-foreground'>{detail}</p>
  </div>
)
