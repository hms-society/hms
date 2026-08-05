import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'

import {
  INTAKE_CONTACT_CHANNEL_LABELS,
  INTAKE_STATUS_LABELS,
} from '../intakes-page/intakes-page-constants'
import { useIntakeDetailsPage } from './use-intake-details-page'

export type IntakeDetailsPageProps = {
  intakeId: string
}

export const IntakeDetailsPage = ({ intakeId }: IntakeDetailsPageProps) => {
  const { intake, intakeError, isLoadingIntake, refetch } = useIntakeDetailsPage(intakeId)

  if (isLoadingIntake) {
    return (
      <main className='mx-auto w-full' aria-labelledby='intake-details-title'>
        <div
          role='status'
          aria-label='Carregando detalhe do intake'
          className='py-16 text-center text-sm text-muted-foreground'
        >
          Carregando detalhe do intake…
        </div>
      </main>
    )
  }

  if (intakeError || !intake) {
    return (
      <main className='mx-auto w-full' aria-labelledby='intake-details-title'>
        <Anchor
          route='intakes'
          className='inline-flex items-center gap-2 text-sm text-brand'
        >
          <Icon name='arrow-left' /> Voltar para intakes
        </Anchor>
        <section
          className='mt-6 rounded-xl border border-border bg-card p-8 text-center shadow-sm'
          role='alert'
        >
          <h1 id='intake-details-title' className='font-serif text-2xl text-brand'>
            Não foi possível carregar o intake
          </h1>
          <p className='mt-2 text-sm text-muted-foreground'>
            Verifique o acesso ao registro e tente novamente.
          </p>
          <Button
            type='button'
            variant='outline'
            className='mt-5'
            onClick={() => void refetch()}
          >
            Tentar novamente
          </Button>
        </section>
      </main>
    )
  }

  return (
    <main className='mx-auto w-full space-y-6' aria-labelledby='intake-details-title'>
      <Anchor
        route='intakes'
        className='inline-flex items-center gap-2 text-sm text-brand'
      >
        <Icon name='arrow-left' /> Voltar para intakes
      </Anchor>
      <header className='flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <p className='mb-2 text-xs font-semibold tracking-[0.16em] text-brand-accent'>
            BOUNDARY DE DETALHE
          </p>
          <h1
            id='intake-details-title'
            className='font-serif text-3xl font-medium text-brand'
          >
            Detalhe do intake
          </h1>
          <p className='mt-2 font-mono text-sm text-muted-foreground'>{intake.id}</p>
        </div>
        <Badge variant='secondary'>
          {INTAKE_STATUS_LABELS[intake.status] ?? intake.status}
        </Badge>
      </header>
      <section className='rounded-xl border border-border bg-card p-5 shadow-sm'>
        <dl className='grid gap-5 sm:grid-cols-2'>
          <div>
            <dt className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
              Cliente
            </dt>
            <dd className='mt-1 text-sm text-foreground'>{intake.clientId}</dd>
          </div>
          <div>
            <dt className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
              Responsável
            </dt>
            <dd className='mt-1 text-sm text-foreground'>{intake.responsibleId}</dd>
          </div>
          <div>
            <dt className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
              Canal de contato
            </dt>
            <dd className='mt-1 text-sm text-foreground'>
              {INTAKE_CONTACT_CHANNEL_LABELS[intake.contactChannel] ??
                intake.contactChannel}
            </dd>
          </div>
          <div>
            <dt className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
              Demanda
            </dt>
            <dd className='mt-1 text-sm text-foreground'>
              {intake.demandNotes ?? 'Sem descrição'}
            </dd>
          </div>
        </dl>
        <p className='mt-6 border-t border-border pt-4 text-sm text-muted-foreground'>
          A ficha operacional completa será disponibilizada em uma etapa posterior.
        </p>
      </section>
    </main>
  )
}
