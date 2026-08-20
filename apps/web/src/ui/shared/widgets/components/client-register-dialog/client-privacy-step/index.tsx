import { Controller } from 'react-hook-form'

import { Button } from '@/ui/shadcn/button'
import { Checkbox } from '@/ui/shadcn/checkbox'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/ui/shadcn/field'
import { Icon } from '@/ui/shared/widgets/components/icon'

import type { ClientRegisterDialogValues } from '../use-client-register-dialog'
import { useClientPrivacyStep } from './use-client-privacy-step'

export type ClientPrivacyStepProps = {
  dialog: ClientRegisterDialogValues
}

export const ClientPrivacyStep = ({ dialog }: ClientPrivacyStepProps) => {
  const { form, consentFields, getConsentChangeHandler } = useClientPrivacyStep(dialog)

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h2 className='font-serif text-xl font-semibold text-foreground sm:text-2xl'>
          Privacidade e consentimentos
        </h2>
        <p className='mt-1 text-xs text-muted-foreground leading-relaxed sm:text-sm'>
          Selecione pelo menos uma forma de comunicação para continuar.
        </p>
      </div>
      <div className='rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs sm:text-sm'>
        <p className='font-medium text-foreground'>
          Texto provisório para desenvolvimento
        </p>
        <p className='mt-0.5 text-xs text-muted-foreground'>
          A redação final dos consentimentos depende da validação jurídica da HMS.
        </p>
      </div>

      {/* Lista de Consentimentos */}
      <fieldset className='grid gap-3'>
        <legend className='sr-only'>Consentimentos disponíveis</legend>
        {consentFields.map(function renderConsentField({
          type,
          copy,
          fieldName,
          disabled,
        }) {
          return (
            <Controller
              key={type}
              name={fieldName}
              control={form.control}
              render={function renderConsentController({ field }) {
                return (
                  <Field
                    orientation='horizontal'
                    data-disabled={disabled || undefined}
                    className={`flex items-start gap-3.5 rounded-xl border border-border bg-card/60 p-4 transition-colors ${disabled ? 'opacity-50' : 'hover:bg-card'}`}
                  >
                    <Checkbox
                      id={`client-consent-${type}`}
                      checked={field.value ?? false}
                      disabled={disabled}
                      onCheckedChange={getConsentChangeHandler(field.onChange)}
                      onBlur={field.onBlur}
                      className='mt-0.5'
                    />
                    <div className='flex-1 space-y-1'>
                      <FieldLabel
                        htmlFor={`client-consent-${type}`}
                        className='text-xs sm:text-sm font-medium text-foreground cursor-pointer'
                      >
                        {copy.label}
                      </FieldLabel>
                      <FieldDescription className='text-xs text-muted-foreground leading-relaxed'>
                        {copy.description}
                      </FieldDescription>
                    </div>
                    <Icon
                      name='shield-check'
                      className='size-4 text-muted-foreground/70 shrink-0 mt-0.5'
                    />
                  </Field>
                )
              }}
            />
          )
        })}
      </fieldset>

      <FieldError>{form.formState.errors.consents?.message}</FieldError>

      {dialog.asyncError && (
        <p role='alert' className='text-xs font-medium text-destructive'>
          {dialog.asyncError}
        </p>
      )}

      {/* Footer de Ações Unificado */}
      <div className='-mx-6 -mb-6 flex flex-col-reverse gap-2 border-t border-border bg-card px-6 py-4 sm:-mx-8 sm:-mb-7 sm:flex-row sm:justify-end sm:px-8'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          className='h-11 rounded-pill border-border bg-card px-5 text-sm font-medium'
          onClick={dialog.handleBackToRegistration}
        >
          Voltar
        </Button>
        <Button
          type='button'
          size='sm'
          className='h-11 rounded-pill px-5 text-sm font-medium shadow-xs'
          onClick={dialog.handleContinueToReview}
        >
          Revisar cadastro
          <Icon name='arrow-right' className='size-3.5' />
        </Button>
      </div>
    </div>
  )
}
