import type { FormalizationSignatureRecipientStatus } from './formalization-signature-recipient-status'
import type { FormalizationSignatureProviderEnvelopeStatus } from './formalization-signature-provider-envelope-status'
import type { FormalizationSignatureProviderItemStatus } from './formalization-signature-provider-item-status'

export type FormalizationSignatureProviderObservation = {
  providerEnvelopeId: string
  envelopeStatus: FormalizationSignatureProviderEnvelopeStatus
  recipients: ReadonlyArray<{
    providerRecipientId: string
    recipientStatus: FormalizationSignatureRecipientStatus
    items: ReadonlyArray<{
      providerEnvelopeItemId: string
      assignment: 'required' | 'not_required'
      status: FormalizationSignatureProviderItemStatus
      requiredFieldCount: number
      completedFieldCount: number
    }>
  }>
  occurredAt: Date
  receivedAt: Date
}
