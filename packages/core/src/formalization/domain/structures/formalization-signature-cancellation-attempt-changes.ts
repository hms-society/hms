import type { FormalizationSignatureCancellationAttempt } from '../entities/formalization-signature-cancellation-attempt'

export type FormalizationSignatureCancellationAttemptChanges = {
  readonly attemptToken?: string
  readonly status?: FormalizationSignatureCancellationAttempt['status']
  readonly attempts?: number
  readonly leaseExpiresAt?: Date
  readonly nextAttemptAt?: Date
  readonly lastFailureCode?: string
  readonly updatedAt: Date
}
