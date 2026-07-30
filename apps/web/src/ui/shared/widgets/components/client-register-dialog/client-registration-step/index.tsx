import { Button } from '@/ui/shadcn/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/ui/shadcn/field'
import { Input } from '@/ui/shadcn/input'
import { NativeSelect, NativeSelectOption } from '@/ui/shadcn/native-select'
import { Icon } from '@/ui/shared/widgets/components/icon'

import type { ClientRegisterDialogController } from '../use-client-register-dialog'
import { useClientRegistrationStep } from './use-client-registration-step'

export type ClientRegistrationStepProps = {
  controller: ClientRegisterDialogController
}

export const ClientRegistrationStep = ({ controller }: ClientRegistrationStepProps) => {
  const {
    form,
    errors,
    type,
    addressErrors,
    handleTypeChange,
    handleTaxIdChange,
    handlePhoneChange,
  } = useClientRegistrationStep(controller)

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h2 className='font-serif text-xl font-semibold text-foreground sm:text-2xl'>
          Dados do cliente
        </h2>
        <p className='mt-1 text-xs text-muted-foreground leading-relaxed sm:text-sm'>
          Preencha apenas os dados necessários para criar o cadastro.
        </p>
      </div>
      <FieldGroup className='gap-4'>
        <Field data-invalid={Boolean(errors.type)}>
          <FieldLabel htmlFor='client-registration-type' className='text-xs font-medium'>
            Tipo de pessoa
          </FieldLabel>
          <NativeSelect
            id='client-registration-type'
            {...form.register('type', { onChange: handleTypeChange })}
            aria-invalid={Boolean(errors.type)}
            className='text-xs h-9'
          >
            <NativeSelectOption value='natural'>Pessoa natural</NativeSelectOption>
            <NativeSelectOption value='legal'>Pessoa jurídica</NativeSelectOption>
          </NativeSelect>
          <FieldError className='text-xs text-destructive'>{errors.type?.message}</FieldError>
        </Field>

        {type === 'natural' ? (
          <Field data-invalid={Boolean(errors.name)}>
            <FieldLabel htmlFor='client-registration-name' className='text-xs font-medium'>
              Nome completo
            </FieldLabel>
            <Input
              id='client-registration-name'
              autoComplete='name'
              className='h-9 text-xs'
              aria-invalid={Boolean(errors.name)}
              {...form.register('name')}
            />
            <FieldError className='text-xs text-destructive'>{errors.name?.message}</FieldError>
          </Field>
        ) : (
          <>
            <Field data-invalid={Boolean(errors.legalName)}>
              <FieldLabel htmlFor='client-registration-legal-name' className='text-xs font-medium'>
                Razão social
              </FieldLabel>
              <Input
                id='client-registration-legal-name'
                autoComplete='organization'
                className='h-9 text-xs'
                aria-invalid={Boolean(errors.legalName)}
                {...form.register('legalName')}
              />
              <FieldError className='text-xs text-destructive'>{errors.legalName?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor='client-registration-trade-name' className='text-xs font-medium'>
                Nome fantasia{' '}
                <span className='font-normal text-muted-foreground'>(opcional)</span>
              </FieldLabel>
              <Input
                id='client-registration-trade-name'
                className='h-9 text-xs'
                {...form.register('tradeName')}
              />
            </Field>
          </>
        )}

        <Field data-invalid={Boolean(errors.taxId)}>
          <FieldLabel htmlFor='client-registration-tax-id' className='text-xs font-medium'>
            {type === 'natural' ? 'CPF' : 'CNPJ'}
          </FieldLabel>
          <Input
            id='client-registration-tax-id'
            className='h-9 text-xs'
            aria-invalid={Boolean(errors.taxId)}
            {...form.register('taxId')}
            onChange={handleTaxIdChange}
          />
          <FieldError className='text-xs text-destructive'>{errors.taxId?.message}</FieldError>
        </Field>
      </FieldGroup>

      <div className='flex flex-col gap-3 pt-2 border-t border-border/60'>
        <h3 className='font-serif text-sm font-semibold text-foreground'>
          Contato <span className='font-sans font-normal text-xs text-muted-foreground'>(opcional)</span>
        </h3>
        <div className='grid gap-4 sm:grid-cols-2'>
          <Field data-invalid={Boolean(errors.email)}>
            <FieldLabel htmlFor='client-registration-email' className='text-xs font-medium'>E-mail</FieldLabel>
            <Input
              id='client-registration-email'
              type='email'
              autoComplete='email'
              className='h-9 text-xs'
              aria-invalid={Boolean(errors.email)}
              {...form.register('email')}
            />
            <FieldError className='text-xs text-destructive'>{errors.email?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor='client-registration-phone' className='text-xs font-medium'>Telefone</FieldLabel>
            <Input
              id='client-registration-phone'
              autoComplete='tel'
              className='h-9 text-xs'
              {...form.register('phone')}
              onChange={handlePhoneChange}
            />
          </Field>
        </div>
      </div>

      <div className='flex flex-col gap-3 pt-2 border-t border-border/60'>
        <div>
          <h3 className='font-serif text-sm font-semibold text-foreground'>
            Endereço <span className='font-sans font-normal text-xs text-muted-foreground'>(opcional)</span>
          </h3>
          <FieldDescription className='text-[11px] text-muted-foreground mt-0.5'>
            Se informar um campo, preencha todos os campos obrigatórios do endereço.
          </FieldDescription>
        </div>

        <div className='grid gap-3 sm:grid-cols-[1fr_8rem]'>
          <Field data-invalid={Boolean(addressErrors?.street)}>
            <FieldLabel htmlFor='client-registration-street' className='text-xs font-medium'>Logradouro</FieldLabel>
            <Input
              id='client-registration-street'
              className='h-9 text-xs'
              aria-invalid={Boolean(addressErrors?.street)}
              {...form.register('address.street')}
            />
            <FieldError className='text-xs text-destructive'>{addressErrors?.street?.message}</FieldError>
          </Field>
          <Field data-invalid={Boolean(addressErrors?.number)}>
            <FieldLabel htmlFor='client-registration-number' className='text-xs font-medium'>Número</FieldLabel>
            <Input
              id='client-registration-number'
              className='h-8 text-xs'
              aria-invalid={Boolean(addressErrors?.number)}
              {...form.register('address.number')}
            />
            <FieldError className='text-xs text-destructive'>{addressErrors?.number?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor='client-registration-complement' className='text-xs font-medium'>Complemento</FieldLabel>
            <Input
              id='client-registration-complement'
              className='h-9 text-xs'
              {...form.register('address.complement')}
            />
          </Field>
          <Field data-invalid={Boolean(addressErrors?.district)}>
            <FieldLabel htmlFor='client-registration-district' className='text-xs font-medium'>Bairro</FieldLabel>
            <Input
              id='client-registration-district'
              className='h-9 text-xs'
              aria-invalid={Boolean(addressErrors?.district)}
              {...form.register('address.district')}
            />
            <FieldError className='text-xs text-destructive'>{addressErrors?.district?.message}</FieldError>
          </Field>
          <Field data-invalid={Boolean(addressErrors?.city)}>
            <FieldLabel htmlFor='client-registration-city' className='text-xs font-medium'>Cidade</FieldLabel>
            <Input
              id='client-registration-city'
              className='h-9 text-xs'
              aria-invalid={Boolean(addressErrors?.city)}
              {...form.register('address.city')}
            />
            <FieldError className='text-xs text-destructive'>{addressErrors?.city?.message}</FieldError>
          </Field>
          <Field data-invalid={Boolean(addressErrors?.state)}>
            <FieldLabel htmlFor='client-registration-state' className='text-xs font-medium'>Estado</FieldLabel>
            <Input
              id='client-registration-state'
              maxLength={2}
              className='h-9 text-xs'
              aria-invalid={Boolean(addressErrors?.state)}
              {...form.register('address.state')}
            />
            <FieldError className='text-xs text-destructive'>{addressErrors?.state?.message}</FieldError>
          </Field>
          <Field data-invalid={Boolean(addressErrors?.zipCode)}>
            <FieldLabel htmlFor='client-registration-zip-code' className='text-xs font-medium'>CEP</FieldLabel>
            <Input
              id='client-registration-zip-code'
              className='h-9 text-xs'
              aria-invalid={Boolean(addressErrors?.zipCode)}
              {...form.register('address.zipCode')}
            />
            <FieldError className='text-xs text-destructive'>{addressErrors?.zipCode?.message}</FieldError>
          </Field>
        </div>
      </div>

      {controller.asyncError && (
        <p role='alert' className='text-xs font-medium text-destructive'>
          {controller.asyncError}
        </p>
      )}

      <div className='-mx-6 -mb-6 flex flex-col-reverse gap-2 border-t border-border bg-muted/30 px-6 py-4 sm:-mx-8 sm:-mb-7 sm:flex-row sm:justify-end sm:px-8'>
        <Button
          type='button'
          variant='outline'
          className='rounded-pill text-sm font-medium h-9 px-6'
          onClick={controller.handleBackToIdentification}
        >
          Voltar
        </Button>
        <Button
          type='button'
          className='rounded-pill text-sm font-medium gap-1.5 h-9 px-6'
          onClick={controller.handleContinueToPrivacy}
        >
          Continuar
          <Icon name='arrow-right' className='size-3.5' />
        </Button>
      </div>
    </div>
  )
}
