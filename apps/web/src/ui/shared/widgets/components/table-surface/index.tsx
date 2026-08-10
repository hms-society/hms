import type { PropsWithChildren } from 'react'

import { cn } from '@/ui/shadcn/utils'

export type TableSurfaceProps = PropsWithChildren<{
  ariaLabel?: string
  className?: string
}>

export const TableSurface = ({ ariaLabel, children, className }: TableSurfaceProps) => {
  return (
    <section
      aria-label={ariaLabel}
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card shadow-sm',
        className,
      )}
    >
      {children}
    </section>
  )
}
