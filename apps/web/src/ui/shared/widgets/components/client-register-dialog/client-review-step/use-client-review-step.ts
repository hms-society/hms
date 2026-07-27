import {
  CONSENT_TYPES,
  type ClientRegisterDialogController,
  type RegistrationForm,
} from '../use-client-register-dialog'

export const CONSENT_LABELS: Record<(typeof CONSENT_TYPES)[number], string> = {
  data_processing: 'Tratamento de dados',
  whatsapp_communication: 'WhatsApp',
  email_communication: 'E-mail',
  third_party_sharing: 'Terceiros',
}

export const MISSING_VALUE = 'Não informado'

export function useClientReviewStep(controller: ClientRegisterDialogController) {
  const draft = controller.draft as RegistrationForm
  const clientName = draft.type === 'natural' ? draft.name : draft.legalName
  const address = draft.address
  const granted = new Set(
    controller.createdClientDetails?.consents.map(function getConsentType(consent) {
      return consent.type
    }),
  )
  const selected = CONSENT_TYPES.filter(function isSelectedConsent(type) {
    return draft.consents?.[type] === true
  })
  const pending = selected.filter(function isPendingConsent(type) {
    return !granted.has(type)
  })
  const canRetry = Boolean(
    controller.createdClientDetails && pending.length > 0 && !controller.isBusy,
  )

  return {
    draft,
    clientName,
    address,
    pending,
    canRetry,
  }
}
