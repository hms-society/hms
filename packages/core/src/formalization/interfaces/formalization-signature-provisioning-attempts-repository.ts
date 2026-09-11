import type { FormalizationSignatureProvisioningAttempt } from '../domain/entities'
import type { FormalizationSignatureProvisioningAttemptChanges } from '../domain/structures'
export interface FormalizationSignatureProvisioningAttemptsRepository {
  add(attempt: FormalizationSignatureProvisioningAttempt): Promise<void>
  findByRequestId(
    requestId: string,
  ): Promise<FormalizationSignatureProvisioningAttempt | null>
  findPending(
    now: Date,
    limit: number,
  ): Promise<FormalizationSignatureProvisioningAttempt[]>
  replace(input: {
    attemptId: string
    changes: FormalizationSignatureProvisioningAttemptChanges
  }): Promise<void>
}
