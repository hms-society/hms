import { Button } from '@/ui/shadcn/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/ui/shadcn/field'
import { Input } from '@/ui/shadcn/input'
import { Icon } from '@/ui/shared/widgets/components/icon'

import type { ClientRegisterDialogController } from '../use-client-register-dialog'
import { useClientIdentificationStep } from './use-client-identification-step'

export type ClientIdentificationStepProps = {
  controller: ClientRegisterDialogController
}

export const ClientIdentificationStep = ({
  controller,
}: ClientIdentificationStepProps) => {
  const { identificationForm, errors, busy, handleTaxIdChange, handlePhoneChange } =
    useClientIdentificationStep(controller)

  return (
    <form onSubmit={controller.handleLookup} className='flex flex-col gap-6'>
      <div>
        <p className='font-sans text-sm text-muted-foreground'>
          Consulte se a pessoa já está cadastrada antes de iniciar um novo registro.
        </p>
      </div>

      <div className='grid gap-4 sm:grid-cols-2'>
        <Field data-invalid={Boolean(errors.taxId)}>
          <FieldLabel htmlFor='client-lookup-tax-id'>CPF ou CNPJ</FieldLabel>
          <Input
            id='client-lookup-tax-id'
            placeholder='000.000.000-00'
            autoComplete='off'
            aria-invalid={Boolean(errors.taxId)}
            aria-describedby={errors.taxId ? 'client-lookup-tax-id-error' : undefined}
            {...identificationForm.register('taxId')}
            onChange={handleTaxIdChange}
          />
          <FieldDescription>
            Use CPF para pessoa natural ou CNPJ para pessoa jurídica.
          </FieldDescription>
          <FieldError id='client-lookup-tax-id-error'>{errors.taxId?.message}</FieldError>
        </Field>

        <Field data-invalid={Boolean(errors.phone)}>
          <FieldLabel htmlFor='client-lookup-phone'>Telefone</FieldLabel>
          <Input
            id='client-lookup-phone'
            placeholder='(00) 00000-0000'
            autoComplete='off'
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? 'client-lookup-phone-error' : undefined}
            {...identificationForm.register('phone')}
            onChange={handlePhoneChange}
          />
          <FieldDescription>
            Use o telefone quando não tiver o documento.
          </FieldDescription>
          <FieldError id='client-lookup-phone-error'>{errors.phone?.message}</FieldError>
        </Field>
      </div>

      {controller.asyncError && (
        <p
          role='alert'
          className='rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive'
        >
          {controller.asyncError}
        </p>
      )}
      <p aria-live='polite' className='text-sm text-muted-foreground'>
        {busy ? 'Buscando cadastro…' : ''}
      </p>

      <div className='flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end'>
        <Button
          type='button'
          variant='outline'
          onClick={controller.handleClearIdentification}
          disabled={busy}
        >
          Limpar
        </Button>
        <Button type='submit' disabled={controller.isBusy}>
          <Icon name='search' />
          {busy ? 'Buscando…' : 'Buscar cliente'}
        </Button>
      </div>
    </form>
  )
}
