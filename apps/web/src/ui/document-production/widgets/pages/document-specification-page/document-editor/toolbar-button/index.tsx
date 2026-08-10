import type { ComponentProps, ReactNode } from 'react'

import { Button } from '@/ui/shadcn/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/shadcn/tooltip'

export type ToolbarButtonProps = ComponentProps<typeof Button> & {
  tooltip: string
  children: ReactNode
}

export const ToolbarButton = ({ tooltip, children, ...props }: ToolbarButtonProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button {...props}>{children}</Button>
    </TooltipTrigger>
    <TooltipContent side='bottom'>{tooltip}</TooltipContent>
  </Tooltip>
)
