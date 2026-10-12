import { Icon } from '@/ui/shared/widgets/components/icon'

export type DossierMilestoneProps = {
  icon: 'list-checks' | 'file-text' | 'pencil'
  label: string
}

export const DossierMilestone = ({ icon, label }: DossierMilestoneProps) => (
  <div className='flex items-center justify-between rounded-md bg-muted/60 px-3 py-2 text-[14px] text-muted-foreground'>
    <span className='flex items-center gap-2'>
      <Icon name={icon} className='size-3' />
      {label}
    </span>
    <Icon name='lock' className='size-3' />
  </div>
)
