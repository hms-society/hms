import type { FormalizationSignatureCancellationAttempt } from '../domain/entities'
import type { FormalizationSignatureCancellationAttemptChanges } from '../domain/structures'
export interface FormalizationSignatureCancellationAttemptsRepository {
  add(attempt: FormalizationSignatureCancellationAttempt): Promise<void>
  findById(attemptId: string): Promise<FormalizationSignatureCancellationAttempt | null>
  findByRequestId(
    requestId: string,
  ): Promise<FormalizationSignatureCancellationAttempt | null>
  findPending(
    now: Date,
    limit: number,
  ): Promise<FormalizationSignatureCancellationAttempt[]>
  claim(input: {
    attemptId: string
    attemptToken: string
    now: Date
    leaseExpiresAt: Date
  }): Promise<FormalizationSignatureCancellationAttempt | null>
  replace(input: {
    attemptId: string
    changes: FormalizationSignatureCancellationAttemptChanges
  }): Promise<void>
}
