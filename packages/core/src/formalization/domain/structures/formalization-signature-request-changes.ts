import type { FormalizationSignatureRequest } from '../entities/formalization-signature-request'

export type FormalizationSignatureRequestChanges = {
  readonly status?: FormalizationSignatureRequest['status']
  readonly sentAt?: Date
  readonly submittedAt?: Date
  readonly confirmedAt?: Date
  readonly terminalAt?: Date
  readonly cancellationRequestedAt?: Date
}
