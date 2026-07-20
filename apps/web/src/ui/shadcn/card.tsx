import type * as React from 'react'
import { cn } from '#/ui/shadcn/utils/index.ts'

function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card'
      className={cn('rounded-xl bg-card text-card-foreground', className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-header'
      className={cn('flex flex-col gap-1.5 p-6', className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot='card-content' className={cn('p-6 pt-0', className)} {...props} />
}

export { Card, CardHeader, CardContent }
