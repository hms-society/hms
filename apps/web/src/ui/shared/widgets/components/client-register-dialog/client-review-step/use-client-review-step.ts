import { useWatch } from 'react-hook-form'

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

type ReviewRow = {
  label: string
  value: string
}

export function useClientReviewStep(controller: ClientRegisterDialogController) {
  const draft = useWatch({
    control: controller.registrationForm.control,
  }) as RegistrationForm

  const clientName = draft.type === 'natural' ? draft.name : draft.legalName
  const address = draft.address
  const addressRows: ReviewRow[] = [
    { label: 'Logradouro', value: address?.street || MISSING_VALUE },
    { label: 'Número', value: address?.number || MISSING_VALUE },
    { label: 'Complemento', value: address?.complement || MISSING_VALUE },
    { label: 'Bairro', value: address?.district || MISSING_VALUE },
    { label: 'Cidade', value: address?.city || MISSING_VALUE },
    { label: 'Estado', value: address?.state || MISSING_VALUE },
    { label: 'CEP', value: address?.zipCode || MISSING_VALUE },
  ]
  const primaryRows: ReviewRow[] = [
    {
      label: draft.type === 'natural' ? 'Nome completo' : 'Razão social',
      value: clientName || MISSING_VALUE,
    },
    {
      label: 'Tipo',
      value: draft.type === 'natural' ? 'Pessoa natural' : 'Pessoa jurídica',
    },
    {
      label: draft.type === 'natural' ? 'CPF' : 'CNPJ',
      value: draft.taxId || MISSING_VALUE,
    },
  ]
  const contactRows: ReviewRow[] = [
    { label: 'Telefone principal', value: draft.phone || MISSING_VALUE },
    { label: 'E-mail', value: draft.email || MISSING_VALUE },
  ]
  const complementaryValues = [
    draft.phone,
    draft.email,
    address?.street,
    address?.number,
    address?.complement,
    address?.district,
    address?.city,
    address?.state,
    address?.zipCode,
  ]
  const complementaryFieldsFilled = complementaryValues.filter(Boolean).length
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
  const consentRows = CONSENT_TYPES.map(function getConsentRow(type) {
    return {
      type,
      label: CONSENT_LABELS[type],
      selected: draft.consents?.[type] === true,
    }
  })

  return {
    draft,
    clientName,
    address,
    primaryRows,
    contactRows,
    addressRows,
    complementaryFieldsFilled,
    consentRows,
    pending,
    canRetry,
  }
}
