import type { ReactNode } from 'react'

import { Card, CardContent, CardHeader } from '@/ui/shadcn/card'

export type DetailsCardProps = {
  title: string
  description: string
  children: ReactNode
  className?: string
}

export const DetailsCard = ({
  title,
  description,
  children,
  className,
}: DetailsCardProps) => {
  return (
    <Card className={`border border-border shadow-sm ${className ?? ''}`}>
      <CardHeader className='gap-1.5 p-5'>
        <h2 className='font-serif text-xl font-semibold text-brand'>{title}</h2>
        <p className='text-sm text-muted-foreground'>{description}</p>
      </CardHeader>
      <CardContent className='p-5 pt-0'>{children}</CardContent>
    </Card>
  )
}
