import type { FormalizationSignatureResultStatus } from './formalization-signature-result-status'

export type FormalizationSignatureResult = {
  readonly status: FormalizationSignatureResultStatus
  readonly hmsReference: string
  readonly protocol?: string
  readonly occurredAt?: Date
  readonly confirmedAt?: Date
}
