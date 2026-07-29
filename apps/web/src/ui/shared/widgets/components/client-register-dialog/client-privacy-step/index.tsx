import { Controller } from 'react-hook-form'

import { Button } from '@/ui/shadcn/button'
import { Checkbox } from '@/ui/shadcn/checkbox'
import { Field, FieldDescription, FieldLabel } from '@/ui/shadcn/field'
import { Icon } from '@/ui/shared/widgets/components/icon'

import type { ClientRegisterDialogController } from '../use-client-register-dialog'
import { useClientPrivacyStep } from './use-client-privacy-step'

export type ClientPrivacyStepProps = {
  controller: ClientRegisterDialogController
}

export const ClientPrivacyStep = ({ controller }: ClientPrivacyStepProps) => {
  const { form, consentFields, getConsentChangeHandler } =
    useClientPrivacyStep(controller)

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h2 className='font-serif text-2xl'>Privacidade e consentimentos</h2>
        <p className='mt-1 text-sm text-muted-foreground'>
          Estas escolhas são independentes e nenhuma delas impede a criação do cliente.
        </p>
      </div>
      <div className='rounded-lg border border-brand-accent/30 bg-accent/50 p-4 text-sm'>
        <p className='font-medium'>Texto provisório para desenvolvimento</p>
        <p className='mt-1 text-muted-foreground'>
          A redação final dos consentimentos depende da validação jurídica da HMS.
        </p>
      </div>
      <fieldset className='grid gap-3'>
        <legend className='sr-only'>Consentimentos disponíveis</legend>
        {consentFields.map(function renderConsentField({ type, copy, fieldName }) {
          return (
            <Controller
              key={type}
              name={fieldName}
              control={form.control}
              render={function renderConsentController({ field }) {
                return (
                  <Field orientation='horizontal' className='rounded-xl border p-4'>
                    <Checkbox
                      id={`client-consent-${type}`}
                      checked={field.value ?? false}
                      onCheckedChange={getConsentChangeHandler(field.onChange)}
                      onBlur={field.onBlur}
                    />
                    <div className='flex-1'>
                      <FieldLabel
                        htmlFor={`client-consent-${type}`}
                        className='font-medium'
                      >
                        {copy.label}
                      </FieldLabel>
                      <FieldDescription>{copy.description}</FieldDescription>
                    </div>
                    <Icon name='shield-check' className='text-muted-foreground' />
                  </Field>
                )
              }}
            />
          )
        })}
      </fieldset>
      {controller.asyncError && (
        <p role='alert' className='text-sm text-destructive'>
          {controller.asyncError}
        </p>
      )}
      <div className='-mx-5 -mb-5 flex flex-col-reverse gap-2 border-t border-border bg-muted/20 px-5 py-4 sm:-mx-8 sm:-mb-7 sm:flex-row sm:justify-end sm:px-8'>
        <Button
          type='button'
          variant='outline'
          onClick={controller.handleBackToRegistration}
        >
          Voltar
        </Button>
        <Button type='button' onClick={controller.handleContinueToReview}>
          Revisar cadastro
          <Icon name='arrow-right' />
        </Button>
      </div>
    </div>
  )
}
