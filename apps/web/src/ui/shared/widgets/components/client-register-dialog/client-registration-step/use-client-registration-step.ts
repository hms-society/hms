import type { ChangeEvent } from 'react'

import type {
  ClientRegisterDialogController,
  RegistrationForm,
} from '../use-client-register-dialog'
import { useMaskPhone } from '../../../../hooks/use-mask-phone'
import { useMaskTaxId } from '../../../../hooks/use-mask-tax-id'

export function useClientRegistrationStep(controller: ClientRegisterDialogController) {
  const form = controller.registrationForm
  const { errors } = form.formState
  const type = form.watch('type')
  const addressErrors = errors.address
  const maskTaxId = useMaskTaxId()
  const maskPhone = useMaskPhone()

  function handleTypeChange(event: ChangeEvent<HTMLSelectElement>) {
    controller.handleClientTypeChange(event.target.value as RegistrationForm['type'])
  }

  function handleTaxIdChange(event: ChangeEvent<HTMLInputElement>) {
    form.setValue('taxId', maskTaxId(event.target.value), {
      shouldDirty: true,
      shouldTouch: true,
    })
  }

  function handlePhoneChange(event: ChangeEvent<HTMLInputElement>) {
    form.setValue('phone', maskPhone(event.target.value), {
      shouldDirty: true,
      shouldTouch: true,
    })
  }

  return {
    form,
    errors,
    type,
    addressErrors,
    handleTypeChange,
    handleTaxIdChange,
    handlePhoneChange,
  }
}
