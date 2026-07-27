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
        <h2 className='font-serif text-2xl'>Dados do cliente</h2>
        <p className='mt-1 text-sm text-muted-foreground'>
          Preencha apenas os dados necessários para criar o cadastro.
        </p>
      </div>

      <FieldGroup>
        <Field data-invalid={Boolean(errors.type)}>
          <FieldLabel htmlFor='client-registration-type'>Tipo de pessoa</FieldLabel>
          <NativeSelect
            id='client-registration-type'
            {...form.register('type', { onChange: handleTypeChange })}
            aria-invalid={Boolean(errors.type)}
          >
            <NativeSelectOption value='natural'>Pessoa natural</NativeSelectOption>
            <NativeSelectOption value='legal'>Pessoa jurídica</NativeSelectOption>
          </NativeSelect>
          <FieldError>{errors.type?.message}</FieldError>
        </Field>

        {type === 'natural' ? (
          <Field data-invalid={Boolean(errors.name)}>
            <FieldLabel htmlFor='client-registration-name'>Nome completo</FieldLabel>
            <Input
              id='client-registration-name'
              autoComplete='name'
              aria-invalid={Boolean(errors.name)}
              {...form.register('name')}
            />
            <FieldError>{errors.name?.message}</FieldError>
          </Field>
        ) : (
          <>
            <Field data-invalid={Boolean(errors.legalName)}>
              <FieldLabel htmlFor='client-registration-legal-name'>
                Razão social
              </FieldLabel>
              <Input
                id='client-registration-legal-name'
                autoComplete='organization'
                aria-invalid={Boolean(errors.legalName)}
                {...form.register('legalName')}
              />
              <FieldError>{errors.legalName?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor='client-registration-trade-name'>
                Nome fantasia{' '}
                <span className='font-normal text-muted-foreground'>(opcional)</span>
              </FieldLabel>
              <Input
                id='client-registration-trade-name'
                {...form.register('tradeName')}
              />
            </Field>
          </>
        )}

        <Field data-invalid={Boolean(errors.taxId)}>
          <FieldLabel htmlFor='client-registration-tax-id'>
            {type === 'natural' ? 'CPF' : 'CNPJ'}
          </FieldLabel>
          <Input
            id='client-registration-tax-id'
            aria-invalid={Boolean(errors.taxId)}
            {...form.register('taxId')}
            onChange={handleTaxIdChange}
          />
          <FieldError>{errors.taxId?.message}</FieldError>
        </Field>
      </FieldGroup>

      <div>
        <h3 className='font-sans text-sm font-semibold'>
          Contato <span className='font-normal text-muted-foreground'>(opcional)</span>
        </h3>
        <div className='mt-3 grid gap-4 sm:grid-cols-2'>
          <Field data-invalid={Boolean(errors.email)}>
            <FieldLabel htmlFor='client-registration-email'>E-mail</FieldLabel>
            <Input
              id='client-registration-email'
              type='email'
              autoComplete='email'
              aria-invalid={Boolean(errors.email)}
              {...form.register('email')}
            />
            <FieldError>{errors.email?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor='client-registration-phone'>Telefone</FieldLabel>
            <Input
              id='client-registration-phone'
              autoComplete='tel'
              {...form.register('phone')}
              onChange={handlePhoneChange}
            />
          </Field>
        </div>
      </div>

      <div>
        <h3 className='font-sans text-sm font-semibold'>
          Endereço <span className='font-normal text-muted-foreground'>(opcional)</span>
        </h3>
        <FieldDescription className='mt-1'>
          Se informar um campo, preencha todos os campos obrigatórios.
        </FieldDescription>
        <div className='mt-3 grid gap-4 sm:grid-cols-[1fr_8rem]'>
          <Field data-invalid={Boolean(addressErrors?.street)}>
            <FieldLabel htmlFor='client-registration-street'>Logradouro</FieldLabel>
            <Input
              id='client-registration-street'
              aria-invalid={Boolean(addressErrors?.street)}
              {...form.register('address.street')}
            />
            <FieldError>{addressErrors?.street?.message}</FieldError>
          </Field>
          <Field data-invalid={Boolean(addressErrors?.number)}>
            <FieldLabel htmlFor='client-registration-number'>Número</FieldLabel>
            <Input
              id='client-registration-number'
              aria-invalid={Boolean(addressErrors?.number)}
              {...form.register('address.number')}
            />
            <FieldError>{addressErrors?.number?.message}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor='client-registration-complement'>Complemento</FieldLabel>
            <Input
              id='client-registration-complement'
              {...form.register('address.complement')}
            />
          </Field>
          <Field data-invalid={Boolean(addressErrors?.district)}>
            <FieldLabel htmlFor='client-registration-district'>Bairro</FieldLabel>
            <Input
              id='client-registration-district'
              aria-invalid={Boolean(addressErrors?.district)}
              {...form.register('address.district')}
            />
            <FieldError>{addressErrors?.district?.message}</FieldError>
          </Field>
          <Field data-invalid={Boolean(addressErrors?.city)}>
            <FieldLabel htmlFor='client-registration-city'>Cidade</FieldLabel>
            <Input
              id='client-registration-city'
              aria-invalid={Boolean(addressErrors?.city)}
              {...form.register('address.city')}
            />
            <FieldError>{addressErrors?.city?.message}</FieldError>
          </Field>
          <Field data-invalid={Boolean(addressErrors?.state)}>
            <FieldLabel htmlFor='client-registration-state'>Estado</FieldLabel>
            <Input
              id='client-registration-state'
              maxLength={2}
              aria-invalid={Boolean(addressErrors?.state)}
              {...form.register('address.state')}
            />
            <FieldError>{addressErrors?.state?.message}</FieldError>
          </Field>
          <Field data-invalid={Boolean(addressErrors?.zipCode)}>
            <FieldLabel htmlFor='client-registration-zip-code'>CEP</FieldLabel>
            <Input
              id='client-registration-zip-code'
              aria-invalid={Boolean(addressErrors?.zipCode)}
              {...form.register('address.zipCode')}
            />
            <FieldError>{addressErrors?.zipCode?.message}</FieldError>
          </Field>
        </div>
      </div>

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
        <Button type='button' onClick={controller.handleContinueToPrivacy}>
          Continuar
          <Icon name='arrow-right' />
        </Button>
      </div>
    </div>
  )
}
