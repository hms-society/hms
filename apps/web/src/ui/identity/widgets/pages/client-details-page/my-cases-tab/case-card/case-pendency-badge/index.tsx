import { Badge } from '@/ui/shadcn/badge'

export type CasePendencyBadgeProps = {
  hasPendency: boolean
}

export const CasePendencyBadge = ({ hasPendency }: CasePendencyBadgeProps) => {
  if (hasPendency) {
    return (
      <Badge
        variant='destructive'
        className='bg-destructive/10 text-destructive dark:bg-destructive/20 border-none'
      >
        Envio de Docs Pendente
      </Badge>
    )
  }

  return (
    <Badge variant='secondary' className='bg-primary/5 text-primary border-none'>
      Sem Pendências
    </Badge>
  )
}
