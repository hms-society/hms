import type { FormalizationSignatureOtpSendAttempt } from '../domain/entities'
import type { FormalizationSignatureOtpSendAttemptChanges } from '../domain/structures'
export interface FormalizationSignatureOtpSendAttemptsRepository {
  add(attempt: FormalizationSignatureOtpSendAttempt): Promise<void>
  findById(attemptId: string): Promise<FormalizationSignatureOtpSendAttempt | null>
  findPending(now: Date, limit: number): Promise<FormalizationSignatureOtpSendAttempt[]>
  replace(input: {
    attemptId: string
    changes: FormalizationSignatureOtpSendAttemptChanges
  }): Promise<void>
}
