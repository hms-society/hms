import type { FormalizationSignatureInvitation } from '../domain/entities'
import type { FormalizationSignatureInvitationChanges } from '../domain/structures'
export interface FormalizationSignatureInvitationsRepository {
  add(invitation: FormalizationSignatureInvitation): Promise<void>
  findById(invitationId: string): Promise<FormalizationSignatureInvitation | null>
  findByTokenHash(tokenHash: string): Promise<FormalizationSignatureInvitation | null>
  findActiveByRecipientId(
    recipientId: string,
  ): Promise<FormalizationSignatureInvitation | null>
  findLatestByRecipientId(
    recipientId: string,
  ): Promise<FormalizationSignatureInvitation | null>
  findConsumedByRecipientAndRequest(input: {
    recipientId: string
    requestId: string
  }): Promise<FormalizationSignatureInvitation | null>
  replace(input: {
    invitationId: string
    changes: FormalizationSignatureInvitationChanges
  }): Promise<void>
}
