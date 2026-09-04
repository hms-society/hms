import type { FormalizationSignatureInvitationSendAttempt } from '../domain/entities'
import type { FormalizationSignatureInvitationSendAttemptChanges } from '../domain/structures'
export interface FormalizationSignatureInvitationSendAttemptsRepository {
  add(attempt: FormalizationSignatureInvitationSendAttempt): Promise<void>
  findById(attemptId: string): Promise<FormalizationSignatureInvitationSendAttempt | null>
  findByInvitationId(
    invitationId: string,
  ): Promise<FormalizationSignatureInvitationSendAttempt | null>
  findPending(
    now: Date,
    limit: number,
  ): Promise<FormalizationSignatureInvitationSendAttempt[]>
  replace(input: {
    attemptId: string
    changes: FormalizationSignatureInvitationSendAttemptChanges
  }): Promise<void>
}
