import { Icon } from '@/ui/shared/widgets/components/icon'
import { Button } from '@/ui/shadcn/button'

export type ChecklistNextActionProps = {
  title: string
  description: string
  isComplete: boolean
  onOpenChecklist: () => void
}

export const ChecklistNextAction = ({
  title,
  description,
  isComplete,
  onOpenChecklist,
}: ChecklistNextActionProps) => (
  <div className='flex flex-col gap-3 rounded-lg border border-primary/30 bg-highlight p-4 shadow-xs md:flex-row md:items-center md:justify-between'>
    <div className='flex items-start gap-3'>
      <div className='flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary'>
        <Icon name='list-checks' className='size-5' />
      </div>
      <div className='flex flex-col gap-0.5'>
        <h2 className='text-[16px] font-semibold text-primary'>{title}</h2>
        <p className='text-[14px] text-primary/80'>{description}</p>
      </div>
    </div>
    <Button size='xs' className='rounded-full' onClick={onOpenChecklist}>
      <Icon name={isComplete ? 'check-circle-2' : 'send'} className='size-3' />
      {isComplete ? 'Revisar checklist' : 'Abrir checklist'}
    </Button>
  </div>
)
