import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Card } from '@/ui/shadcn/card'
import { Skeleton } from '@/ui/shadcn/skeleton'
import { CaseActionType } from '../../case-action-type'
import { CaseStatusBadge } from '../../case-status-badge'
import { useCaseDetails } from '../use-case-details'

export type TopDetailsProps = Record<string, never>

export const TopDetails = (_props: TopDetailsProps) => {
  const { caseDetails, isLoading, error } = useCaseDetails()

  if (isLoading) {
    return (
      <Card className='flex flex-col md:flex-row justify-between items-start md:items-center p-8 gap-6 bg-card border border-border/60 shadow-sm relative overflow-hidden'>
        <div className='flex flex-col gap-2 z-10'>
          <Skeleton className='h-8 w-64' />
          <Skeleton className='h-4 w-32' />
        </div>
        <div className='flex flex-col md:items-end gap-2 z-10 shrink-0'>
          <Skeleton className='h-8 w-32' />
          <Skeleton className='h-4 w-48' />
        </div>
      </Card>
    )
  }

  if (!caseDetails || error) throw new Error('Case details not found')

  return (
    <Card className='flex flex-col md:flex-row justify-between items-start md:items-center p-8 gap-6 bg-card border border-border/60 shadow-sm relative overflow-hidden'>
      <div className='absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none' />
      <div className='flex flex-col gap-2 z-10'>
        <h1 className='text-3xl md:text-4xl font-semibold font-serif text-brand dark:text-primary'>
          <CaseActionType areaId={caseDetails.legalAreaId} />
        </h1>
        <span className='text-muted-foreground text-sm font-mono'>
          Caso #{caseDetails.sequenceNumber} • ID: {caseDetails.id.slice(0, 8)}
        </span>
      </div>
      <div className='flex flex-col md:items-end gap-2 z-10 shrink-0'>
        <CaseStatusBadge status={caseDetails.status} className='text-sm px-4 py-2' />
        <span className='text-xs text-muted-foreground'>
          Última atualização:{' '}
          {format(new Date(caseDetails.updatedAt), "dd 'de' MMMM 'às' HH:mm", {
            locale: ptBR,
          })}
        </span>
      </div>
    </Card>
  )
}
