import type { ChangeEvent } from 'react'

import type { ClientRegisterDialogController } from '../use-client-register-dialog'
import { useMaskPhone } from '../../../../hooks/use-mask-phone'
import { useMaskTaxId } from '../../../../hooks/use-mask-tax-id'

export function useClientIdentificationStep(controller: ClientRegisterDialogController) {
  const identificationForm = controller.identificationForm
  const { errors } = identificationForm.formState
  const busy = controller.requestLock === 'lookup'
  const maskTaxId = useMaskTaxId()
  const maskPhone = useMaskPhone()

  function handleTaxIdChange(event: ChangeEvent<HTMLInputElement>) {
    identificationForm.setValue('taxId', maskTaxId(event.target.value), {
      shouldDirty: true,
      shouldTouch: true,
    })
  }

  function handlePhoneChange(event: ChangeEvent<HTMLInputElement>) {
    identificationForm.setValue('phone', maskPhone(event.target.value), {
      shouldDirty: true,
      shouldTouch: true,
    })
  }

  return {
    identificationForm,
    errors,
    busy,
    handleTaxIdChange,
    handlePhoneChange,
  }
}
