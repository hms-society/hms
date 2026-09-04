import type { FormalizationSignatureRequestStatus } from './formalization-signature-request-status'

export type FormalizationSignatureProjectionChanges = {
  readonly signatureRequestId?: string
  readonly signatureStatus: FormalizationSignatureRequestStatus
  readonly signatureSubmittedAt?: Date
  readonly signatureConfirmedAt?: Date
  readonly signatureTerminalAt?: Date
}
