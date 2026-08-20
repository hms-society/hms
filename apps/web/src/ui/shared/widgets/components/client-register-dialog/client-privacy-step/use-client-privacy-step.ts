import { useEffect } from 'react'
import { useWatch } from 'react-hook-form'

import {
  CONSENT_TYPES,
  type ClientRegisterDialogValues,
} from '../use-client-register-dialog'

export const CONSENT_COPY = {
  whatsapp_communication: {
    label: 'Comunicação por WhatsApp',
    description: 'Autoriza mensagens operacionais pelo WhatsApp.',
  },
  email_communication: {
    label: 'Comunicação por e-mail',
    description: 'Autoriza mensagens operacionais por e-mail.',
  },
  third_party_sharing: {
    label: 'Compartilhamento com terceiros',
    description: 'Autoriza o compartilhamento quando necessário para o atendimento.',
  },
} as const

export function useClientPrivacyStep(dialog: ClientRegisterDialogValues) {
  const { registrationForm: form } = dialog
  const email = useWatch({ control: form.control, name: 'email' })
  const phone = useWatch({ control: form.control, name: 'phone' })
  const hasEmail = Boolean(email?.trim())
  const hasWhatsapp = Boolean(phone?.replace(/\D/g, ''))

  useEffect(
    function clearUnavailableCommunicationConsents() {
      if (!hasEmail && form.getValues('consents.email_communication')) {
        form.setValue('consents.email_communication', false, {
          shouldDirty: true,
          shouldValidate: true,
        })
      }

      if (!hasWhatsapp && form.getValues('consents.whatsapp_communication')) {
        form.setValue('consents.whatsapp_communication', false, {
          shouldDirty: true,
          shouldValidate: true,
        })
      }
    },
    [form, hasEmail, hasWhatsapp],
  )

  const consentFields = CONSENT_TYPES.map(function getConsentField(type) {
    return {
      type,
      copy: CONSENT_COPY[type],
      fieldName: `consents.${type}` as const,
      disabled:
        (type === 'email_communication' && !hasEmail) ||
        (type === 'whatsapp_communication' && !hasWhatsapp),
    }
  })

  function getConsentChangeHandler(onChange: (value: boolean) => void) {
    return function handleConsentChange(checked: boolean | 'indeterminate') {
      onChange(checked === true)
    }
  }

  return {
    form,
    consentFields,
    getConsentChangeHandler,
  }
}
