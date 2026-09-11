import type * as React from 'react'

import { cn } from '@/ui/shadcn/utils/index.ts'
import { ChevronDownIcon } from 'lucide-react'

type NativeSelectProps = Omit<React.ComponentProps<'select'>, 'size'> & {
  size?: 'sm' | 'default'
}

function NativeSelect({ className, size = 'default', ...props }: NativeSelectProps) {
  return (
    <div
      className={cn('group/native-select relative w-fit', className)}
      data-slot='native-select-wrapper'
      data-size={size}
    >
      <select
        data-slot='native-select'
        data-size={size}
        className='h-11 w-full min-w-0 appearance-none rounded-lg border border-border bg-card py-1 pr-10 pl-3 font-sans text-sm font-medium text-foreground shadow-xs transition-[border-color,box-shadow,background-color] outline-none select-none selection:bg-primary selection:text-primary-foreground hover:border-primary/45 hover:bg-highlight/40 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-border disabled:bg-muted/50 disabled:text-muted-foreground disabled:opacity-100 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=sm]:h-9 data-[size=sm]:rounded-[min(var(--radius-md),10px)] data-[size=sm]:py-0.5 data-[size=sm]:pr-9 data-[size=sm]:pl-3 dark:bg-input/30 dark:hover:bg-input/50 dark:disabled:bg-muted/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40'
        {...props}
      />
      <ChevronDownIcon
        className='pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 rounded-full text-primary opacity-80 transition-transform group-focus-within/native-select:rotate-180 group-data-[size=sm]/native-select:right-2.5 group-data-[size=sm]/native-select:size-3.5'
        aria-hidden='true'
        data-slot='native-select-icon'
      />
    </div>
  )
}

function NativeSelectOption({ className, ...props }: React.ComponentProps<'option'>) {
  return (
    <option
      data-slot='native-select-option'
      className={cn('bg-[Canvas] text-[CanvasText]', className)}
      {...props}
    />
  )
}

function NativeSelectOptGroup({ className, ...props }: React.ComponentProps<'optgroup'>) {
  return (
    <optgroup
      data-slot='native-select-optgroup'
      className={cn('bg-[Canvas] text-[CanvasText]', className)}
      {...props}
    />
  )
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption }
