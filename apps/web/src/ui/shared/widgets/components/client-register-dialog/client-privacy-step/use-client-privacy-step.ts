import {
  CONSENT_TYPES,
  type ClientRegisterDialogValues,
} from '../use-client-register-dialog'

export const CONSENT_COPY = {
  data_processing: {
    label: 'Tratamento de dados',
    description: 'Autoriza o uso dos dados para a prestação dos serviços da HMS.',
  },
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
  const consentFields = CONSENT_TYPES.map(function getConsentField(type) {
    return {
      type,
      copy: CONSENT_COPY[type],
      fieldName: `consents.${type}` as const,
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
