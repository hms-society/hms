import type { FormalizationSignatureRecipient } from '../domain/entities'
import type { FormalizationSignatureRecipientChanges } from '../domain/structures'
export interface FormalizationSignatureRecipientsRepository {
  addMany(
    recipients: readonly FormalizationSignatureRecipient[],
  ): Promise<FormalizationSignatureRecipient[]>
  findById(recipientId: string): Promise<FormalizationSignatureRecipient | null>
  listByRequestId(requestId: string): Promise<FormalizationSignatureRecipient[]>
  replace(input: {
    recipientId: string
    expectedVersion: number
    changes: FormalizationSignatureRecipientChanges
  }): Promise<boolean>
}
