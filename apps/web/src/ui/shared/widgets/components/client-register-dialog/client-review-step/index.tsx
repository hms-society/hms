import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent, CardHeader } from '@/ui/shadcn/card'
import { Icon } from '@/ui/shared/widgets/components/icon'

import type { ClientRegisterDialogController } from '../use-client-register-dialog'
import { useClientReviewStep } from './use-client-review-step'

export type ClientReviewStepProps = {
  controller: ClientRegisterDialogController
}

export const ClientReviewStep = ({ controller }: ClientReviewStepProps) => {
  const {
    primaryRows,
    contactRows,
    addressRows,
    complementaryFieldsFilled,
    consentRows,
    pending,
    canRetry,
  } = useClientReviewStep(controller)

  return (
    <form onSubmit={controller.handleSubmitRegistration} className='flex flex-col gap-6'>
      <div>
        <h2 className='font-serif text-xl font-semibold text-foreground sm:text-2xl'>
          Revisão do cliente
        </h2>
        <p className='mt-1 text-xs text-muted-foreground leading-relaxed sm:text-sm'>
          Confira os dados antes de concluir. Você pode editar qualquer seção.
        </p>
      </div>
      <Card className='rounded-xl border border-border bg-card/60 shadow-xs'>
        <CardHeader className='flex-row items-center justify-between gap-4 px-5 py-4 border-b border-border/60'>
          <div className='flex items-center gap-2'>
            <Icon name='id-card' className='size-4 text-primary' />
            <h3 className='font-serif text-sm font-semibold text-foreground'>
              Identificação
            </h3>
          </div>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground'
            onClick={controller.handleBackToIdentification}
          >
            <Icon name='pencil' className='size-3.5' />
            Editar
          </Button>
        </CardHeader>
        <CardContent className='grid gap-2.5 p-5 text-xs sm:text-sm'>
          {primaryRows.map(function renderPrimaryRow(row) {
            return (
              <div key={row.label} className='flex items-center justify-between gap-4'>
                <span className='text-muted-foreground'>{row.label}</span>
                <span className='text-right font-medium text-foreground'>
                  {row.value}
                </span>
              </div>
            )
          })}
        </CardContent>
      </Card>
      <Card className='rounded-xl border border-border bg-card/60 shadow-xs'>
        <CardHeader className='flex-row items-center justify-between gap-4 px-5 py-4 border-b border-border/60'>
          <div className='flex items-center gap-2'>
            <Icon name='list-plus' className='size-4 text-primary' />
            <h3 className='font-serif text-sm font-semibold text-foreground'>
              Complementares
            </h3>
          </div>
          <Badge
            variant='outline'
            className='h-5 px-2 text-[10px] font-normal rounded-full border-border'
          >
            {complementaryFieldsFilled} de 9 preenchidos
          </Badge>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground'
            onClick={controller.handleBackToRegistration}
          >
            <Icon name='pencil' className='size-3.5' />
            Editar
          </Button>
        </CardHeader>
        <CardContent className='grid gap-2.5 p-5 text-xs sm:text-sm'>
          <p className='pb-0.5 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground'>
            CONTATO
          </p>
          {contactRows.map(function renderContactRow(row) {
            return (
              <div key={row.label} className='flex items-center justify-between gap-4'>
                <span className='text-muted-foreground'>{row.label}</span>
                <span className='text-right font-medium text-foreground'>
                  {row.value}
                </span>
              </div>
            )
          })}
          <p className='pt-2 pb-0.5 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground'>
            ENDEREÇO
          </p>
          {addressRows.map(function renderAddressRow(row) {
            return (
              <div key={row.label} className='flex items-center justify-between gap-4'>
                <span className='text-muted-foreground'>{row.label}</span>
                <span className='text-right font-medium text-foreground'>
                  {row.value}
                </span>
              </div>
            )
          })}
        </CardContent>
      </Card>
      <Card className='rounded-xl border border-border bg-card/60 shadow-xs'>
        <CardHeader className='flex-row items-center justify-between gap-4 px-5 py-4 border-b border-border/60'>
          <div className='flex items-center gap-2'>
            <Icon name='shield-check' className='size-4 text-primary' />
            <h3 className='font-serif text-sm font-semibold text-foreground'>
              Privacidade
            </h3>
          </div>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground'
            onClick={controller.handleBackToPrivacy}
          >
            <Icon name='pencil' className='size-3.5' />
            Editar
          </Button>
        </CardHeader>
        <CardContent className='grid gap-2.5 p-5 text-xs sm:text-sm'>
          {consentRows.map(function renderConsentStatus({ type, label, selected }) {
            return (
              <div key={type} className='flex items-center justify-between gap-3'>
                <span className='text-muted-foreground'>{label}</span>
                <Badge variant={selected ? 'default' : 'outline'} className='text-[11px]'>
                  {selected ? 'Selecionado' : 'Não registrado'}
                </Badge>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {controller.createdClientDetails && pending.length > 0 && (
        <div
          role='status'
          className='rounded-xl border border-brand-accent/40 bg-accent/50 p-4 text-xs sm:text-sm'
        >
          <p className='font-medium text-foreground'>O cliente foi criado.</p>
          <p className='mt-1 text-muted-foreground'>
            Ainda faltam:{' '}
            {pending
              .map(function getConsentLabel(type) {
                return consentRows.find((row) => row.type === type)?.label ?? type
              })
              .join(', ')}
            .
          </p>
          {canRetry && (
            <Button
              type='button'
              className='mt-3 rounded-pill text-xs h-8 px-4'
              variant='outline'
              onClick={controller.handleRetryPendingConsents}
            >
              Tentar consentimentos pendentes
            </Button>
          )}
        </div>
      )}

      {controller.asyncError && (
        <p
          role='alert'
          className='rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive'
        >
          {controller.asyncError}
        </p>
      )}

      <div className='flex items-start gap-2 rounded-xl border border-primary/20 bg-secondary px-4 py-3 text-xs text-secondary-foreground'>
        <Icon name='info' className='mt-0.5 size-3.5 shrink-0 text-primary' />
        <p>Ao concluir, apenas o cliente será criado.</p>
      </div>
      <div className='-mx-6 -mb-6 flex flex-col-reverse gap-2 border-t border-border bg-muted/30 px-6 py-4 sm:-mx-8 sm:-mb-7 sm:flex-row sm:items-center sm:justify-between sm:px-8'>
        <Button
          type='button'
          variant='outline'
          className='rounded-pill text-sm font-medium h-9 px-6'
          onClick={controller.handleBackToPrivacy}
          disabled={controller.isBusy}
        >
          Voltar
        </Button>
        <Button
          type='button'
          className='rounded-pill text-sm font-medium gap-1.5 h-9 px-6'
          disabled={
            controller.isBusy ||
            Boolean(controller.createdClientDetails && pending.length === 0)
          }
          onClick={controller.handleSubmitRegistration}
        >
          {controller.requestLock === 'registration' ||
          controller.requestLock === 'consents'
            ? 'Salvando…'
            : controller.createdClientDetails
              ? 'Concluir consentimentos'
              : 'Concluir cadastro'}
          {!controller.isBusy && <Icon name='check' className='size-3.5' />}
        </Button>
      </div>
    </form>
  )
}
