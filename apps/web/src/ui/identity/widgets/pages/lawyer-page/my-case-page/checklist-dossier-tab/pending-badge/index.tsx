import { Badge } from '@/ui/shadcn/badge'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type PendingBadgeProps = {
  count: number
  singular?: boolean
}

export const PendingBadge = ({ count, singular = false }: PendingBadgeProps) =>
  count > 0 ? (
    <Badge variant='destructive' className='h-5 rounded-full px-2 text-[12px]'>
      <Icon name='alert-circle' className='size-3' />
      {count} pendência{singular ? '' : '(s)'}
    </Badge>
  ) : null
