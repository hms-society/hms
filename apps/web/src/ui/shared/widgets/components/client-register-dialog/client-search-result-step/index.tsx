import { Button } from '@/ui/shadcn/button'
import { Card, CardContent } from '@/ui/shadcn/card'
import { Icon } from '@/ui/shared/widgets/components/icon'

import type {
  ClientRegisterDialogValues,
  ClientRegisterDialogSearchResult,
} from '../use-client-register-dialog'
import { ClientSummary } from './client-summary'
import { useClientSearchResultStep } from './use-client-search-result-step'

export type ClientSearchResultStepProps = {
  dialog: ClientRegisterDialogValues
  result: ClientRegisterDialogSearchResult
}

export const ClientSearchResultStep = ({
  dialog,
  result,
}: ClientSearchResultStepProps) => {
  const { maskedTaxId, maskedPhone } = useClientSearchResultStep(result)

  if (result.kind === 'existing') {
    return (
      <div className='flex flex-col gap-6'>
        <div>
          <h2 className='font-serif text-xl font-semibold text-foreground sm:text-2xl'>
            Cliente já cadastrado
          </h2>
          <p className='mt-1 text-xs text-muted-foreground leading-relaxed sm:text-sm'>
            Não é possível criar outro registro com o mesmo documento.
          </p>
        </div>

        <ClientSummary details={result.details} />

        {dialog.asyncError && (
          <p role='alert' className='text-xs font-medium text-destructive'>
            {dialog.asyncError}
          </p>
        )}
        <div className='-mx-6 -mb-6 flex flex-col-reverse gap-2 border-t border-border bg-muted/30 px-6 py-4 sm:-mx-8 sm:-mb-7 sm:flex-row sm:justify-end sm:px-8'>
          <Button
            type='button'
            variant='outline'
            className='rounded-pill text-xs font-medium'
            onClick={dialog.handleSearchAnotherClient}
          >
            Buscar outro cliente
          </Button>
          <Button
            type='button'
            className='rounded-pill text-xs font-medium gap-1.5'
            onClick={dialog.handleSelectExistingClient}
          >
            <Icon name='check' className='size-3.5' />
            Abrir cadastro
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h2 className='font-serif text-xl font-semibold text-foreground sm:text-2xl'>
          Cliente não encontrado
        </h2>
        <p className='mt-1 text-xs text-muted-foreground leading-relaxed sm:text-sm'>
          Não encontramos um cadastro para os critérios informados. Você pode iniciar um
          novo registro.
        </p>
      </div>
      <Card className='rounded-xl border border-border bg-card/60 shadow-xs'>
        <CardContent className='grid gap-4 p-5 text-xs sm:grid-cols-2 sm:text-sm'>
          <div className='flex flex-col gap-1'>
            <span className='text-xs font-medium text-muted-foreground'>CPF/CNPJ</span>
            <p className='font-semibold text-foreground'>
              {maskedTaxId || 'Não informado'}
            </p>
          </div>
          <div className='flex flex-col gap-1'>
            <span className='text-xs font-medium text-muted-foreground'>Telefone</span>
            <p className='font-semibold text-foreground'>
              {maskedPhone || 'Não informado'}
            </p>
          </div>
        </CardContent>
      </Card>

      {dialog.asyncError && (
        <p role='alert' className='text-xs font-medium text-destructive'>
          {dialog.asyncError}
        </p>
      )}
      <div className='-mx-6 -mb-6 flex flex-col-reverse gap-2 border-t border-border bg-muted/30 px-6 py-4 sm:-mx-8 sm:-mb-7 sm:flex-row sm:justify-end sm:px-8'>
        <Button
          type='button'
          variant='outline'
          className='rounded-pill text-xs font-medium'
          onClick={dialog.handleBackToIdentification}
        >
          Voltar
        </Button>
        <Button
          type='button'
          className='rounded-pill text-xs font-medium gap-1.5'
          onClick={dialog.handleContinueToRegistration}
        >
          Continuar cadastro
          <Icon name='arrow-right' className='size-3.5' />
        </Button>
      </div>
    </div>
  )
}
