import type { ChecklistItem } from '../../types'
import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { getChecklistActionIcon, getChecklistActionLabel } from '../../checklist-style'

export type ChecklistItemActionsProps = {
  item: ChecklistItem
  readOnly: boolean
  onOpen: (itemId: string) => void
  onValidate: (itemId: string) => void
}

export const ChecklistItemActions = ({
  item,
  readOnly,
  onOpen,
  onValidate,
}: ChecklistItemActionsProps) => (
  <div className='flex shrink-0 items-center gap-2 self-end md:self-center'>
    {!readOnly && item.documentFileId && (
      <Button
        variant='brand'
        size='xs'
        className='h-8 rounded-full bg-accent px-3 text-[12px] text-accent-foreground'
        onClick={() => onValidate(item.id)}
      >
        <Icon
          name={getChecklistActionIcon(item.status, Boolean(item.documentName))}
          className='size-3'
        />
        {getChecklistActionLabel(item.status, Boolean(item.documentName))}
      </Button>
    )}
    {!readOnly && (
      <Button
        variant='outline'
        size='icon-xs'
        aria-label={`Abrir ${item.title}`}
        className='size-7 rounded-full bg-background text-muted-foreground'
        onClick={() => onOpen(item.id)}
      >
        <Icon name='arrow-right' className='size-3' />
      </Button>
    )}
  </div>
)
