import type { FormalizationSignatureRecipient } from '../entities/formalization-signature-recipient'

export type FormalizationSignatureRecipientChanges = {
  readonly status?: FormalizationSignatureRecipient['status']
  readonly invitedAt?: Date
  readonly submittedAt?: Date
  readonly submissionObservationId?: string
  readonly confirmedAt?: Date
  readonly terminalAt?: Date
}
