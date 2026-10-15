import { Icon } from '@/ui/shared/widgets/components/icon'

export type DossierMilestoneProps = {
  icon: 'list-checks' | 'file-text' | 'pencil'
  label: string
  complete: boolean
}

export const DossierMilestone = ({ icon, label, complete }: DossierMilestoneProps) => (
  <div className='flex items-center justify-between rounded-md bg-muted/60 px-3 py-2 text-[14px] text-muted-foreground'>
    <span className='flex items-center gap-2'>
      <Icon name={icon} className='size-3' />
      {label}
    </span>
    <span role='img' aria-label={`${label}: ${complete ? 'Concluído' : 'Pendente'}`}>
      <Icon name={complete ? 'check' : 'lock'} className='size-3' />
    </span>
  </div>
)
