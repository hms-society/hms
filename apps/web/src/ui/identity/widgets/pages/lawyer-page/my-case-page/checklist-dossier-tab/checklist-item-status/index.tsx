import type { ChecklistItem } from '../../types'
import { useChecklistItemStatus } from './use-checklist-item-status'
import { Badge } from '@/ui/shadcn/badge'
import { PendingBadge } from '../pending-badge'

export type ChecklistItemStatusProps = {
  item: ChecklistItem
  pendingCount: number
}

export const ChecklistItemStatus = ({ item, pendingCount }: ChecklistItemStatusProps) => {
  const { badge, pendingBadgeProps } = useChecklistItemStatus(item, pendingCount)
  return badge ? (
    <Badge variant={badge.variant} className='h-5 rounded-full px-2 text-[12px]'>
      {badge.label}
    </Badge>
  ) : (
    <PendingBadge {...pendingBadgeProps} />
  )
}
