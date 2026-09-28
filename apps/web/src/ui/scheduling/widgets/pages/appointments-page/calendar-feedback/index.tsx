import { LockKeyhole, RefreshCw, TriangleAlert } from 'lucide-react'

import { Button } from '@/ui/shadcn/button'

export type CalendarFeedbackVariant =
  | 'loading'
  | 'empty'
  | 'filtered-empty'
  | 'error'
  | 'forbidden'

export type CalendarFeedbackProps = {
  variant: CalendarFeedbackVariant
  onRetry?: () => void
  onClearFilters?: () => void
}

export function CalendarFeedback({
  variant,
  onRetry,
  onClearFilters,
}: CalendarFeedbackProps) {
  if (variant === 'loading') {
    return (
      <div
        className='flex min-h-72 items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground'
        role='status'
      >
        <RefreshCw className='mr-2 size-5 animate-spin' aria-hidden='true' />
        Carregando agenda…
      </div>
    )
  }

  if (variant === 'forbidden') {
    return (
      <div className='flex min-h-72 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-8 text-center'>
        <LockKeyhole className='size-8 text-muted-foreground' aria-hidden='true' />
        <h2 className='font-serif text-xl font-semibold'>Agenda restrita</h2>
        <p className='max-w-md text-sm text-muted-foreground'>
          Seu perfil não tem acesso às agendas solicitadas.
        </p>
      </div>
    )
  }

  if (variant === 'error') {
    return (
      <div
        className='flex min-h-72 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-8 text-center'
        role='alert'
      >
        <TriangleAlert className='size-8 text-destructive' aria-hidden='true' />
        <h2 className='font-serif text-xl font-semibold'>
          Não foi possível carregar a agenda
        </h2>
        <p className='max-w-md text-sm text-muted-foreground'>
          Tente novamente. Nenhum dado pessoal foi alterado.
        </p>
        <Button variant='outline' onClick={onRetry}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className='flex min-h-72 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card p-8 text-center'>
      <h2 className='font-serif text-xl font-semibold'>
        {variant === 'filtered-empty' ? 'Nenhuma consulta encontrada' : 'Agenda vazia'}
      </h2>
      <p className='max-w-md text-sm text-muted-foreground'>
        {variant === 'filtered-empty'
          ? 'Ajuste os filtros para ver outros compromissos e bloqueios.'
          : 'Não há compromissos ou bloqueios neste período.'}
      </p>
      {variant === 'filtered-empty' ? (
        <Button variant='outline' onClick={onClearFilters}>
          Limpar filtros
        </Button>
      ) : null}
    </div>
  )
}
