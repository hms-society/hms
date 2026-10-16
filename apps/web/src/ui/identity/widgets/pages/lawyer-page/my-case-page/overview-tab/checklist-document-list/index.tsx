import {
  getChecklistIcon,
  getChecklistIconClasses,
  getChecklistRowClasses,
} from '../../checklist-style'
import type { ChecklistItem } from '../../types'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Badge } from '@/ui/shadcn/badge'

export type ChecklistDocumentListProps = { items: ChecklistItem[] }

function getChecklistBadge(item: ChecklistItem) {
  if (item.statusLabel) return item.statusLabel
  if (item.status === 'validado') return 'Validado'
  if (item.status === 'solicitado') return 'Solicitado'
  return 'Não solicitado'
}

function getChecklistBadgeVariant(item: ChecklistItem) {
  if (item.status === 'validado') return 'success' as const
  if (item.status === 'solicitado') return 'attention' as const
  return 'secondary' as const
}

export const ChecklistDocumentList = ({ items }: ChecklistDocumentListProps) => (
  <div className='flex flex-col gap-2'>
    {items.length > 0 ? (
      items.map((item) => (
        <div
          key={item.id}
          className={`flex min-w-0 items-center justify-between gap-3 rounded-md border px-3 py-2 ${getChecklistRowClasses(item.status)}`}
        >
          <div className='flex min-w-0 items-center gap-3'>
            <div
              className={`flex size-6 shrink-0 items-center justify-center rounded-md ${getChecklistIconClasses(item.status)}`}
            >
              <Icon name={getChecklistIcon(item.status)} className='size-3' />
            </div>
            <span className='truncate text-[14px] font-semibold text-foreground'>
              {item.title}
            </span>
          </div>
          {item.documentFileId && (
            <Badge
              variant={getChecklistBadgeVariant(item)}
              className='h-6 rounded-full px-3 text-[12px]'
            >
              {getChecklistBadge(item)}
            </Badge>
          )}
        </div>
      ))
    ) : (
      <div className='rounded-md border border-border bg-muted/30 px-3 py-4 text-xs text-muted-foreground'>
        Nenhum item de checklist documental foi encontrado para este caso.
      </div>
    )}
  </div>
)
