import type { FormalizationSignatureProvisioningAttempt } from '../entities/formalization-signature-provisioning-attempt'

export type FormalizationSignatureProvisioningAttemptChanges = {
  readonly attemptToken?: string
  readonly status?: FormalizationSignatureProvisioningAttempt['status']
  readonly attempts?: number
  readonly leaseExpiresAt?: Date
  readonly nextAttemptAt?: Date
  readonly lastFailureCode?: string
  readonly updatedAt: Date
}
