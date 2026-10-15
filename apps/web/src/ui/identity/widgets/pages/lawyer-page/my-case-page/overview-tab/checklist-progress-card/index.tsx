import type { ChecklistItem } from '../../types'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { ChecklistDocumentList } from '../checklist-document-list'

export type ChecklistProgressCardProps = {
  items: ChecklistItem[]
  completionPercentage: number
  mandatoryItemsCount: number
  pendingItemsCount: number
  validatedItemsCount: number
  onOpenChecklist: () => void
}

function getProgressLabels(props: ChecklistProgressCardProps) {
  const hasItems = props.mandatoryItemsCount > 0
  const isComplete = hasItems && props.pendingItemsCount === 0
  const status = !hasItems
    ? 'Checklist não instanciado'
    : isComplete
      ? 'Completo para validação'
      : 'Recebimento parcial'
  const variant = !hasItems ? 'secondary' : isComplete ? 'success' : 'attention'
  return {
    status,
    variant: variant as 'secondary' | 'success' | 'attention',
    progress: `${props.validatedItemsCount} de ${props.mandatoryItemsCount} - ${props.completionPercentage}%`,
  }
}

export const ChecklistProgressCard = (props: ChecklistProgressCardProps) => {
  const labels = getProgressLabels(props)

  return (
    <section className='flex flex-col gap-4 rounded-lg border border-border bg-secondary p-5 shadow-xs'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div className='flex flex-wrap items-center gap-2'>
          <h2 className='font-serif text-lg font-semibold text-foreground'>
            Checklist Documental
          </h2>
          <Badge variant={labels.variant} className='h-6 rounded-full px-3 text-[12px]'>
            {labels.status}
          </Badge>
        </div>
        <Button
          variant='link'
          size='xs'
          className='h-auto justify-start px-0 text-primary'
          onClick={props.onOpenChecklist}
        >
          Abrir checklist completo <Icon name='arrow-right' className='size-3' />
        </Button>
      </div>
      <div className='flex items-center gap-3'>
        <div className='h-2 flex-1 overflow-hidden rounded-full bg-muted'>
          <div
            className='h-full rounded-full bg-primary'
            style={{ width: `${props.completionPercentage}%` }}
          />
        </div>
        <span className='text-[14px] font-semibold text-foreground'>
          {labels.progress}
        </span>
      </div>
      <ChecklistDocumentList items={props.items} />
    </section>
  )
}
