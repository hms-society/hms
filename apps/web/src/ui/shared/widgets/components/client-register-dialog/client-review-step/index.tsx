import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent, CardHeader } from '@/ui/shadcn/card'
import { Icon } from '@/ui/shared/widgets/components/icon'

import {
  CONSENT_TYPES,
  type ClientRegisterDialogController,
} from '../use-client-register-dialog'
import {
  CONSENT_LABELS,
  MISSING_VALUE,
  useClientReviewStep,
} from './use-client-review-step'

export type ClientReviewStepProps = {
  controller: ClientRegisterDialogController
}

export const ClientReviewStep = ({ controller }: ClientReviewStepProps) => {
  const { draft, clientName, address, pending, canRetry } =
    useClientReviewStep(controller)

  return (
    <form onSubmit={controller.handleSubmitRegistration} className='flex flex-col gap-5'>
      <div>
        <h2 className='font-serif text-2xl'>Revise o cadastro</h2>
        <p className='mt-1 text-sm text-muted-foreground'>
          Confirme os dados antes de criar o Client.
        </p>
      </div>

      <Card className='border-border/70'>
        <CardHeader className='flex-row items-center justify-between'>
          <h3 className='font-sans text-sm font-semibold'>Identificação</h3>
          <Button
            type='button'
            variant='link'
            size='sm'
            onClick={controller.handleBackToIdentification}
          >
            Editar
          </Button>
        </CardHeader>
        <CardContent className='grid gap-3 text-sm sm:grid-cols-2'>
          <div>
            <span className='text-muted-foreground'>Tipo</span>
            <p>{draft.type === 'natural' ? 'Pessoa natural' : 'Pessoa jurídica'}</p>
          </div>
          <div>
            <span className='text-muted-foreground'>Nome</span>
            <p>{clientName || MISSING_VALUE}</p>
          </div>
          <div>
            <span className='text-muted-foreground'>CPF/CNPJ</span>
            <p>{draft.taxId || MISSING_VALUE}</p>
          </div>
        </CardContent>
      </Card>

      <Card className='border-border/70'>
        <CardHeader className='flex-row items-center justify-between'>
          <h3 className='font-sans text-sm font-semibold'>Contato e endereço</h3>
          <Button
            type='button'
            variant='link'
            size='sm'
            onClick={controller.handleBackToRegistration}
          >
            Editar
          </Button>
        </CardHeader>
        <CardContent className='grid gap-3 text-sm sm:grid-cols-2'>
          <div>
            <span className='text-muted-foreground'>E-mail</span>
            <p>{draft.email || MISSING_VALUE}</p>
          </div>
          <div>
            <span className='text-muted-foreground'>Telefone</span>
            <p>{draft.phone || MISSING_VALUE}</p>
          </div>
          <div className='sm:col-span-2'>
            <span className='text-muted-foreground'>Endereço</span>
            <p>
              {address?.street ? `${address.street}, ${address.number}` : MISSING_VALUE}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className='border-border/70'>
        <CardHeader className='flex-row items-center justify-between'>
          <h3 className='font-sans text-sm font-semibold'>Privacidade</h3>
          <Button
            type='button'
            variant='link'
            size='sm'
            onClick={controller.handleBackToPrivacy}
          >
            Editar
          </Button>
        </CardHeader>
        <CardContent className='grid gap-2 text-sm sm:grid-cols-2'>
          {CONSENT_TYPES.map(function renderConsentStatus(type) {
            return (
              <div key={type} className='flex items-center justify-between gap-3'>
                <span>{CONSENT_LABELS[type]}</span>
                <Badge variant={draft.consents?.[type] ? 'default' : 'outline'}>
                  {draft.consents?.[type] ? 'Selecionado' : 'Não registrado'}
                </Badge>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {controller.createdClientDetails && pending.length > 0 && (
        <div
          role='status'
          className='rounded-lg border border-brand-accent/40 bg-accent/50 p-4 text-sm'
        >
          <p className='font-medium'>O Client foi criado.</p>
          <p className='mt-1 text-muted-foreground'>
            Ainda faltam:{' '}
            {pending
              .map(function getConsentLabel(type) {
                return CONSENT_LABELS[type]
              })
              .join(', ')}
            .
          </p>
          {canRetry && (
            <Button
              type='button'
              className='mt-3'
              variant='outline'
              onClick={controller.handleRetryPendingConsents}
            >
              Tentar consentimentos pendentes
            </Button>
          )}
        </div>
      )}
      {controller.asyncError && (
        <p role='alert' className='text-sm text-destructive'>
          {controller.asyncError}
        </p>
      )}
      <p className='text-sm text-muted-foreground'>
        Ao concluir, apenas o Client será criado. Nenhum Intake será criado ou vinculado.
      </p>
      <div className='flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end'>
        <Button
          type='button'
          variant='outline'
          onClick={controller.handleBackToPrivacy}
          disabled={controller.isBusy}
        >
          Voltar
        </Button>
        <Button
          type='submit'
          disabled={
            controller.isBusy ||
            Boolean(controller.createdClientDetails && pending.length === 0)
          }
        >
          {controller.requestLock === 'registration' ||
          controller.requestLock === 'consents'
            ? 'Salvando…'
            : controller.createdClientDetails
              ? 'Concluir consentimentos'
              : 'Criar Client'}
          {!controller.isBusy && <Icon name='check' />}
        </Button>
      </div>
    </form>
  )
}
