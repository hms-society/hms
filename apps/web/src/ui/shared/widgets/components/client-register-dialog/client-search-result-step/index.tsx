import { Button } from '@/ui/shadcn/button'
import { Card, CardContent } from '@/ui/shadcn/card'
import { Icon } from '@/ui/shared/widgets/components/icon'

import type {
  ClientRegisterDialogController,
  ClientRegisterDialogSearchResult,
} from '../use-client-register-dialog'
import { ClientSummary } from './client-summary'
import { useClientSearchResultStep } from './use-client-search-result-step'

export type ClientSearchResultStepProps = {
  controller: ClientRegisterDialogController
  result: ClientRegisterDialogSearchResult
}

export const ClientSearchResultStep = ({
  controller,
  result,
}: ClientSearchResultStepProps) => {
  const { maskedTaxId, maskedPhone } = useClientSearchResultStep(result)

  if (result.kind === 'existing') {
    return (
      <div className='flex flex-col gap-6'>
        <div>
          <h2 className='font-serif text-2xl'>Cliente já cadastrado</h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            Não é possível criar outro registro com o mesmo documento.
          </p>
        </div>
        <ClientSummary details={result.details} />
        {controller.asyncError && (
          <p role='alert' className='text-sm text-destructive'>
            {controller.asyncError}
          </p>
        )}
        <div className='flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end'>
          <Button
            type='button'
            variant='outline'
            onClick={controller.handleSearchAnotherClient}
          >
            Buscar outro cliente
          </Button>
          <Button type='button' onClick={controller.handleSelectExistingClient}>
            <Icon name='check' />
            Abrir cadastro
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h2 className='font-serif text-2xl'>Cliente não encontrado</h2>
        <p className='mt-1 text-sm text-muted-foreground'>
          Não encontramos um cadastro para os critérios informados. Você pode iniciar um
          novo registro.
        </p>
      </div>
      <Card className='border-border/70'>
        <CardContent className='grid gap-3 pt-6 text-sm sm:grid-cols-2'>
          <div>
            <span className='text-muted-foreground'>CPF/CNPJ</span>
            <p>{maskedTaxId}</p>
          </div>
          <div>
            <span className='text-muted-foreground'>Telefone</span>
            <p>{maskedPhone}</p>
          </div>
        </CardContent>
      </Card>
      {controller.asyncError && (
        <p role='alert' className='text-sm text-destructive'>
          {controller.asyncError}
        </p>
      )}
      <div className='flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end'>
        <Button
          type='button'
          variant='outline'
          onClick={controller.handleBackToIdentification}
        >
          Voltar
        </Button>
        <Button type='button' onClick={controller.handleContinueToRegistration}>
          Continuar cadastro
          <Icon name='arrow-right' />
        </Button>
      </div>
    </div>
  )
}
