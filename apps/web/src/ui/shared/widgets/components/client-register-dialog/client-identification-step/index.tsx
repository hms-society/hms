import { Button } from '@/ui/shadcn/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/ui/shadcn/field'
import { Input } from '@/ui/shadcn/input'
import { Icon } from '@/ui/shared/widgets/components/icon'

import type { ClientRegisterDialogValues } from '../use-client-register-dialog'
import { useClientIdentificationStep } from './use-client-identification-step'

export type ClientIdentificationStepProps = {
  dialog: ClientRegisterDialogValues
}

export const ClientIdentificationStep = ({ dialog }: ClientIdentificationStepProps) => {
  const { identificationForm, errors, busy, handleTaxIdChange, handlePhoneChange } =
    useClientIdentificationStep(dialog)

  return (
    <form onSubmit={dialog.handleLookup} className='flex flex-col gap-6'>
      <div>
        <h2 className='font-serif text-xl font-semibold text-foreground sm:text-2xl'>
          Consulte o cadastro
        </h2>
        <p className='mt-1 max-w-2xl text-xs text-muted-foreground leading-relaxed sm:text-sm'>
          Consulte se a pessoa já está cadastrada antes de iniciar um novo registro.
        </p>
      </div>

      <div className='grid gap-4 sm:grid-cols-2'>
        <Field data-invalid={Boolean(errors.taxId)}>
          <FieldLabel htmlFor='client-lookup-tax-id' className='text-xs font-medium'>
            CPF ou CNPJ
          </FieldLabel>
          <Input
            id='client-lookup-tax-id'
            placeholder='000.000.000-00'
            autoComplete='off'
            className='h-9 text-xs'
            aria-invalid={Boolean(errors.taxId)}
            aria-describedby={errors.taxId ? 'client-lookup-tax-id-error' : undefined}
            {...identificationForm.register('taxId', { onChange: handleTaxIdChange })}
          />
          <FieldDescription className='text-[11px] text-muted-foreground'>
            Use CPF para pessoa física ou CNPJ para pessoa jurídica.
          </FieldDescription>
          <FieldError
            id='client-lookup-tax-id-error'
            className='text-xs text-destructive'
          >
            {errors.taxId?.message}
          </FieldError>
        </Field>

        <Field data-invalid={Boolean(errors.phone)}>
          <FieldLabel htmlFor='client-lookup-phone' className='text-xs font-medium'>
            WhatsApp
          </FieldLabel>
          <Input
            id='client-lookup-phone'
            placeholder='+55 (11) 99999-9999'
            autoComplete='off'
            className='h-9 text-xs'
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? 'client-lookup-phone-error' : undefined}
            {...identificationForm.register('phone', { onChange: handlePhoneChange })}
          />
          <FieldDescription className='text-[11px] text-muted-foreground'>
            Use o WhatsApp quando não tiver o documento.
          </FieldDescription>
          <FieldError id='client-lookup-phone-error' className='text-xs text-destructive'>
            {errors.phone?.message}
          </FieldError>
        </Field>
      </div>

      {dialog.asyncError && (
        <p
          role='alert'
          className='rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive'
        >
          {dialog.asyncError}
        </p>
      )}
      <span aria-live='polite' className='sr-only'>
        {busy ? 'Buscando cadastro…' : ''}
      </span>
      <div className='-mx-6 -mb-6 flex flex-col-reverse gap-2 border-t border-border bg-card px-6 py-4 sm:-mx-8 sm:-mb-7 sm:flex-row sm:justify-end sm:px-8'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          className='h-11 rounded-pill border-border bg-card px-5 text-sm font-medium'
          onClick={dialog.handleClearIdentification}
          disabled={busy}
        >
          Limpar
        </Button>
        <Button
          type='submit'
          size='sm'
          className='h-11 rounded-pill px-5 text-sm font-medium shadow-xs'
          disabled={dialog.isBusy}
        >
          <Icon name='search' className='size-3.5' />
          {busy ? 'Buscando…' : 'Buscar cliente'}
        </Button>
      </div>
    </form>
  )
}
