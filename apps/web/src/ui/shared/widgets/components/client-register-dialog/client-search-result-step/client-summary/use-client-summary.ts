import type { ClientDetails } from '@hms/core/identity/domain/entities'
import { useMaskPhone } from '../../../../../hooks/use-mask-phone'
import { useMaskTaxId } from '../../../../../hooks/use-mask-tax-id'

function getClientName(details: ClientDetails) {
  return details.client.type === 'natural'
    ? details.client.name
    : details.client.legalName
}

function getClientInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function useClientSummary(details: ClientDetails) {
  const maskTaxId = useMaskTaxId()
  const maskPhone = useMaskPhone()
  const clientName = getClientName(details)
  const activeTypes = new Set(
    details.consents.map(function getConsentType(consent) {
      return consent.type
    }),
  )

  return {
    activeTypes,
    clientName,
    clientInitials: getClientInitials(clientName),
    clientType: details.client.type === 'natural' ? 'Pessoa física' : 'Pessoa jurídica',
    taxId: maskTaxId(details.client.taxId.value),
    phone: maskPhone(details.client.phone) || 'Não informado',
  }
}
