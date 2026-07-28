import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Field, FieldError } from '@/ui/shadcn/field'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { ClientRegisterDialog } from '@/ui/shared/widgets/components/client-register-dialog'

import { useClientStep } from './use-client-step'

export const ClientStep = () => {
  const {
    client,
    clientId,
    clientInitials,
    clientName,
    error,
    formattedTaxId,
    isClientDialogOpen,
    handleChangeClient,
    handleClientDialogChange,
    handleClientSelected,
  } = useClientStep()

  return (
    <div className='flex flex-col gap-5'>
      <div className='flex items-center justify-between border-b border-border pb-4'>
        <div className='flex items-center gap-2'>
          <Icon name='user' className='size-4 text-primary' />
          <h2 className='font-sans text-sm font-semibold text-foreground'>
            Cliente do intake
          </h2>
        </div>
        {clientId && (
          <Badge className='rounded-pill bg-highlight text-highlight-foreground hover:bg-highlight'>
            <Icon name='check' className='size-3' />
            Vinculado
          </Badge>
        )}
      </div>

      {client ? (
        <div className='flex flex-col gap-5 rounded-lg border border-primary bg-secondary p-4 sm:flex-row sm:items-center'>
          <div className='flex min-w-0 flex-1 items-start gap-4'>
            <Avatar className='size-11 border border-primary bg-card'>
              <AvatarFallback className='bg-card text-sm font-semibold text-primary'>
                {clientInitials}
              </AvatarFallback>
            </Avatar>
            <div className='min-w-0 space-y-1.5'>
              <p className='text-sm font-semibold text-foreground'>{clientName}</p>
              <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
                <span className='inline-flex items-center gap-1.5'>
                  <Icon name='id-card' className='size-3' />
                  {formattedTaxId}
                </span>
                <Badge variant='secondary' className='rounded-pill text-[10px]'>
                  Interessado
                </Badge>
              </div>
              <p className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                <Icon name='phone' className='size-3' />
                {client.phone || 'Telefone não informado'}
              </p>
              <p className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                <Icon name='mail' className='size-3' />
                <span className='truncate'>{client.email || 'E-mail não informado'}</span>
              </p>
            </div>
          </div>

          <div className='flex shrink-0 flex-row gap-2 sm:w-44 sm:flex-col'>
            <Button
              type='button'
              size='lg'
              className='h-16 min-h-16 flex-1 justify-center rounded-lg shadow-xs sm:w-full'
            >
              <Icon name='external-link' />
              Ver cadastro
            </Button>
            <Button
              type='button'
              size='lg'
              variant='outline'
              className='h-16 min-h-16 flex-1 justify-center rounded-lg border-border/80 bg-card text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary sm:w-full'
              onClick={handleChangeClient}
            >
              <Icon name='refresh-cw' />
              Trocar cliente
            </Button>
          </div>
        </div>
      ) : (
        <Field data-invalid={Boolean(error)} className='gap-3'>
          <div className='flex flex-col gap-4 rounded-lg border border-dashed border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex min-w-0 items-start gap-3'>
              <span className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary'>
                <Icon name='user' className='size-5' />
              </span>
              <div className='min-w-0'>
                <p className='text-sm font-semibold text-foreground'>
                  Nenhum cliente vinculado
                </p>
                <p className='mt-1 max-w-xl text-xs leading-5 text-muted-foreground'>
                  Selecione um cliente existente ou cadastre um novo para continuar.
                </p>
              </div>
            </div>
            <Button
              type='button'
              className='w-full shrink-0 rounded-pill sm:w-auto'
              onClick={() => handleClientDialogChange(true)}
            >
              <Icon name='search' />
              Identificar ou cadastrar cliente
            </Button>
          </div>
          <FieldError>{error?.message}</FieldError>
        </Field>
      )}

      <ClientRegisterDialog
        open={isClientDialogOpen}
        onOpenChange={handleClientDialogChange}
        onClientSelected={handleClientSelected}
      />
    </div>
  )
}
