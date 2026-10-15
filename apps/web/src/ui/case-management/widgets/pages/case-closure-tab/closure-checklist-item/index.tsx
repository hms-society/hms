import type { ReactNode } from 'react'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Badge } from '@/ui/shadcn/badge'

export type ClosureChecklistItemProps = {
  title: string
  detail: string
  complete: boolean
  status: string
  children?: ReactNode
}

export const ClosureChecklistItem = ({
  title,
  detail,
  complete,
  status,
  children,
}: ClosureChecklistItemProps) => (
  <div
    className={`rounded-xl border p-4 ${complete ? 'border-primary/20 bg-primary/5' : 'border-border bg-muted/30'}`}
  >
    <div className='flex flex-wrap items-start justify-between gap-3'>
      <div className='flex items-start gap-3'>
        <span
          className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${complete ? 'bg-primary text-primary-foreground' : 'border border-border bg-background text-muted-foreground'}`}
        >
          <Icon name={complete ? 'check' : 'circle'} className='size-3.5' />
        </span>
        <div>
          <h3 className='text-sm font-semibold text-foreground'>{title}</h3>
          <p className='mt-1 text-xs leading-5 text-muted-foreground'>{detail}</p>
          {children && (
            <div className='mt-3 flex flex-col items-start gap-2'>{children}</div>
          )}
        </div>
      </div>
      <Badge variant={complete ? 'success' : 'attention'}>{status}</Badge>
    </div>
  </div>
)
