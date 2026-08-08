import type * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Tabs as TabsPrimitive } from 'radix-ui'
import { cn } from '@/ui/shadcn/utils/index.ts'

function Tabs({
  className,
  orientation = 'horizontal',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        'group/tabs flex gap-2 data-horizontal:flex-col',
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  'group/tabs-list inline-flex items-center text-muted-foreground',
  {
    variants: {
      variant: {
        default: 'w-fit rounded-lg bg-muted p-[3px]',
        line:
          'w-full flex-row justify-start gap-8 rounded-none border-b border-border bg-transparent p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

function TabsList({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}
function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        'relative inline-flex items-center justify-center gap-2 whitespace-nowrap px-2 py-3 text-sm font-medium text-muted-foreground transition-colors outline-none shrink-0 cursor-pointer',
        'after:absolute after:bottom-[-1px] after:left-0 after:h-[3px] after:w-full after:scale-x-0 after:bg-[#134C50] after:transition-transform after:duration-200',
        'data-[state=active]:text-[#134C50]',
        'data-[state=active]:after:scale-x-100',
        className
      )}
      {...props}
    />
  )
}
function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex-1 outline-none', className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }