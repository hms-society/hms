import type * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'

import { cn } from '@/ui/shadcn/utils/index.ts'

const badgeVariants = cva(
  'group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent p-3 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!',
  {
    variants: {
      variant: {
        default:
          'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] [a]:hover:border-[var(--brand)] [a]:hover:bg-[var(--brand)]',
        secondary:
          'border-[var(--border)] bg-[var(--secondary)] text-[var(--secondary-foreground)] [a]:hover:border-[var(--input)] [a]:hover:bg-[var(--muted)]',
        destructive:
          'border-[var(--badge-destructive-border)] bg-[var(--badge-destructive)] text-[var(--badge-destructive-foreground)] focus-visible:ring-destructive/30 [a]:hover:brightness-95',
        outline:
          'border-[var(--input)] bg-[var(--card)] text-[var(--foreground)] [a]:hover:border-[var(--primary)] [a]:hover:bg-[var(--secondary)] [a]:hover:text-[var(--secondary-foreground)]',
        ghost:
          'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
        link: 'text-[var(--brand)] underline-offset-4 hover:text-[var(--primary)] hover:underline',
        success:
          'border-[var(--badge-success-border)] bg-[var(--badge-success)] text-[var(--badge-success-foreground)] [a]:hover:brightness-95',
        waiting:
          'border-[var(--badge-waiting-border)] bg-[var(--badge-waiting)] text-[var(--badge-waiting-foreground)] [a]:hover:brightness-95',
        attention:
          'border-[var(--badge-attention-border)] bg-[var(--badge-attention)] text-[var(--badge-attention-foreground)] [a]:hover:brightness-95',
        info: 'border-[var(--badge-info-border)] bg-[var(--badge-info)] text-[var(--badge-info-foreground)] [a]:hover:brightness-95',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span'

  return (
    <Comp
      data-slot='badge'
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
