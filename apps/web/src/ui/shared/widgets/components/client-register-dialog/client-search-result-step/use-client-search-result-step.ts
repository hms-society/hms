import type { ConsentType } from '@hms/core/identity/domain/structures'

import type { ClientRegisterDialogSearchResult } from '../use-client-register-dialog'
import { useMaskPhone } from '../../../../hooks/use-mask-phone'
import { useMaskTaxId } from '../../../../hooks/use-mask-tax-id'

export const CONSENT_LABELS: Record<ConsentType, string> = {
  data_processing: 'Tratamento de dados',
  whatsapp_communication: 'WhatsApp',
  email_communication: 'E-mail',
  third_party_sharing: 'Terceiros',
}

export function useClientSearchResultStep(result: ClientRegisterDialogSearchResult) {
  const maskTaxId = useMaskTaxId()
  const maskPhone = useMaskPhone()

  return {
    maskedTaxId:
      result.kind === 'not-found' && result.criteria.taxId
        ? maskTaxId(result.criteria.taxId)
        : 'Não informado',
    maskedPhone:
      result.kind === 'not-found'
        ? maskPhone(result.criteria.phone) || 'Não informado'
        : 'Não informado',
  }
}
