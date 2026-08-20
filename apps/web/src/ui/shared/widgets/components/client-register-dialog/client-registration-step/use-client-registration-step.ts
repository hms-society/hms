import type { ChangeEvent } from 'react'

import type {
  ClientRegisterDialogValues,
  RegistrationForm,
} from '../use-client-register-dialog'
import { useMaskPhone } from '../../../../hooks/use-mask-phone'
import { useMaskTaxId } from '../../../../hooks/use-mask-tax-id'

export function useClientRegistrationStep(dialog: ClientRegisterDialogValues) {
  const { registrationForm: form, handleClientTypeChange } = dialog
  const { errors } = form.formState
  const type = form.watch('type')
  const addressErrors = errors.address
  const maskTaxId = useMaskTaxId()
  const maskPhone = useMaskPhone()

  function handleTypeChange(event: ChangeEvent<HTMLSelectElement>) {
    handleClientTypeChange(event.target.value as RegistrationForm['type'])
  }

  function handleTaxIdChange(event: ChangeEvent<HTMLInputElement>) {
    form.setValue('taxId', maskTaxId(event.target.value), {
      shouldDirty: true,
    })
  }

  function handlePhoneChange(event: ChangeEvent<HTMLInputElement>) {
    form.setValue('phone', maskPhone(event.target.value), {
      shouldDirty: true,
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
