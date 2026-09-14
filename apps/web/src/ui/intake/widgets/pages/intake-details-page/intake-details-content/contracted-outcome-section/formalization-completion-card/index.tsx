import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent } from '@/ui/shadcn/card'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'

import {
  useFormalizationCompletionCard,
  type FormalizationCompletionCardProps,
} from './use-formalization-completion-card'

export type { FormalizationCompletionCardProps } from './use-formalization-completion-card'

export const FormalizationCompletionCard = (props: FormalizationCompletionCardProps) => {
  const { completedAtLabel, formalizationId, isCompleted, isUnavailable } =
    useFormalizationCompletionCard(props)

  return (
    <Card className='border border-border shadow-sm'>
      <CardContent className='space-y-3 p-5'>
        <header className='flex min-h-6 items-center justify-between gap-4'>
          <div className='flex min-w-0 items-center gap-2'>
            <Icon name='check-circle-2' className='size-5 shrink-0 text-primary' />
            <p className='font-serif text-base font-semibold'>Formalização</p>
          </div>
          <Badge variant={isCompleted ? 'success' : 'waiting'}>
            {isCompleted ? 'Concluída' : 'Indisponível'}
          </Badge>
        </header>
        {isUnavailable ? (
          <div
            className='flex flex-col gap-3 rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm sm:flex-row sm:items-center sm:justify-between'
            role='alert'
          >
            <p>Não foi possível carregar o resumo da formalização.</p>
            <Button
              type='button'
              variant='outline'
              className='min-h-11'
              onClick={props.onRetry}
            >
              Tentar novamente
            </Button>
          </div>
        ) : (
          <>
            <div className='flex items-center gap-3 rounded-lg bg-[var(--badge-success)] p-3 text-[var(--badge-success-foreground)]'>
              <span className='flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground'>
                <Icon name='check' className='size-4' />
              </span>
              <div className='min-w-0'>
                <h3 className='text-sm font-semibold'>Contratação confirmada</h3>
                <p className='text-xs'>
                  A formalização foi concluída após a confirmação de todas as assinaturas.
                </p>
              </div>
            </div>
            <dl className='grid gap-3 rounded-lg bg-secondary p-3 sm:grid-cols-2'>
              <div className='sm:border-r sm:border-border sm:pr-3'>
                <dt className='text-xs text-muted-foreground'>Concluída em</dt>
                <dd className='mt-1 text-sm font-semibold'>{completedAtLabel}</dd>
              </div>
              <div>
                <dt className='flex items-center gap-1 text-xs text-muted-foreground'>
                  <Icon name='check-circle-2' className='size-3.5 text-primary' />
                  Assinaturas
                </dt>
                <dd className='mt-1 flex items-center gap-1 text-sm font-semibold'>
                  <Icon name='check-circle-2' className='size-3.5 text-primary' />
                  Todas confirmadas
                </dd>
              </div>
            </dl>
            <footer className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <p className='text-xs text-muted-foreground'>
                Configuração e histórico disponíveis para consulta.
              </p>
              {formalizationId ? (
                <Button
                  asChild
                  type='button'
                  variant='outline'
                  className='min-h-11 rounded-full px-4'
                >
                  <Anchor route='formalization' params={{ formalizationId }}>
                    Abrir formalização <Icon name='external-link' className='size-4' />
                  </Anchor>
                </Button>
              ) : null}
            </footer>
          </>
        )}
      </CardContent>
    </Card>
  )
}
