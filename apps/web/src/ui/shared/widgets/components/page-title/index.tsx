import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '@/ui/shadcn/utils'

export type PageTitleProps = ComponentPropsWithoutRef<'h1'>

export const PageTitle = ({ className, ...props }: PageTitleProps) => {
  return (
    <h1
      className={cn(
        'font-serif text-4xl font-medium tracking-tight text-brand',
        className,
      )}
      {...props}
    />
  )
}
