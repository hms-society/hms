import type { ChecklistItem } from '../../types'
import {
  getChecklistRowClasses,
  getChecklistIconClasses,
  getChecklistIcon,
} from '../../checklist-style'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { ChecklistItemStatus } from '../checklist-item-status'
import { ChecklistItemActions } from '../checklist-item-actions'

export type ChecklistItemRowProps = {
  item: ChecklistItem
  pendingCount: number
  readOnly: boolean
  onOpen: (itemId: string) => void
  onValidate: (itemId: string) => void
}

export const ChecklistItemRow = ({
  item,
  pendingCount,
  readOnly,
  onOpen,
  onValidate,
}: ChecklistItemRowProps) => (
  <div
    className={`flex min-w-0 flex-col gap-3 rounded-md border px-3 py-2 md:flex-row md:items-center md:justify-between ${getChecklistRowClasses(item.status)}`}
  >
    <div className='flex min-w-0 items-center gap-3'>
      <div
        className={`flex size-6 shrink-0 items-center justify-center rounded-md ${getChecklistIconClasses(item.status)}`}
      >
        <Icon name={getChecklistIcon(item.status)} className='size-3' />
      </div>
      <div className='flex min-w-0 flex-col gap-0.5'>
        <div className='flex flex-wrap items-center gap-1.5'>
          <span className='text-[14px] font-semibold text-foreground'>{item.title}</span>
          <ChecklistItemStatus item={item} pendingCount={pendingCount} />
        </div>
        <span className='truncate text-[14px] text-muted-foreground'>
          {item.documentName || item.subtitle}
        </span>
      </div>
    </div>
    <ChecklistItemActions
      item={item}
      readOnly={readOnly}
      onOpen={onOpen}
      onValidate={onValidate}
    />
  </div>
)
