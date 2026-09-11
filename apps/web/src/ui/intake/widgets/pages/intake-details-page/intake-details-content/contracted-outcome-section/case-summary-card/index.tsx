import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent } from '@/ui/shadcn/card'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { useCaseSummaryCard, type CaseSummaryCardProps } from './use-case-summary-card'

export type { CaseSummaryCardProps } from './use-case-summary-card'

export const CaseSummaryCard = (props: CaseSummaryCardProps) => {
  const { caseCode, dateLabel, isUnavailable, legalAreaLabel, lawyerLabel, statusLabel } =
    useCaseSummaryCard(props)
  const helpId = 'case-action-help'

  return (
    <Card className='border border-border shadow-sm'>
      <CardContent className='space-y-3 p-5'>
        <header className='flex min-h-6 items-center justify-between gap-4'>
          <div className='flex min-w-0 items-center gap-2'>
            <Icon name='briefcase' className='size-5 shrink-0 text-muted-foreground' />
            <p className='font-serif text-base font-semibold'>Caso</p>
          </div>
          <Badge variant={props.legalCase ? 'info' : 'secondary'}>{statusLabel}</Badge>
        </header>
        {isUnavailable ? (
          <div
            className='flex flex-col gap-3 rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm sm:flex-row sm:items-center sm:justify-between'
            role='alert'
          >
            <p>Não foi possível carregar o resumo do caso.</p>
            <Button
              type='button'
              variant='outline'
              className='min-h-11'
              onClick={props.onRetry}
            >
              Tentar novamente
            </Button>
          </div>
        ) : props.legalCase ? (
          <div className='rounded-lg bg-secondary p-3 sm:p-4'>
            <h3 className='font-serif text-lg font-semibold'>{caseCode}</h3>
            <dl className='mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-3'>
              <div>
                <dt className='text-xs text-muted-foreground'>Área jurídica</dt>
                <dd className='mt-1 text-sm font-medium'>{legalAreaLabel}</dd>
              </div>
              <div>
                <dt className='text-xs text-muted-foreground'>Advogado principal</dt>
                <dd className='mt-1 text-sm font-medium'>{lawyerLabel}</dd>
              </div>
              <div>
                <dt className='text-xs text-muted-foreground'>Aberto em</dt>
                <dd className='mt-1 text-sm font-medium'>{dateLabel}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <div className='rounded-lg bg-muted p-3 sm:p-4'>
            <h3 className='font-serif text-lg font-semibold'>{caseCode}</h3>
            <p className='mt-1 text-sm text-muted-foreground'>
              Nenhum caso foi iniciado para este Intake.
            </p>
          </div>
        )}
        <footer className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <p id={helpId} className='text-xs text-muted-foreground'>
            A visualização detalhada de casos estará disponível em uma próxima etapa.
          </p>
          <Button
            type='button'
            variant='outline'
            className='min-h-11 rounded-full px-4 sm:shrink-0'
            disabled
            aria-describedby={helpId}
          >
            Abrir caso <Icon name='external-link' className='size-4' />
          </Button>
        </footer>
      </CardContent>
    </Card>
  )
}
