import type { FormalizationSignatureRecipientDocument } from '../domain/entities'

export interface FormalizationSignatureRecipientDocumentsRepository {
  addMany(
    assignments: readonly FormalizationSignatureRecipientDocument[],
  ): Promise<FormalizationSignatureRecipientDocument[]>
  listByRequestId(requestId: string): Promise<FormalizationSignatureRecipientDocument[]>
  listByRecipientId(
    recipientId: string,
  ): Promise<FormalizationSignatureRecipientDocument[]>
  listByRequestDocumentId(
    requestDocumentId: string,
  ): Promise<FormalizationSignatureRecipientDocument[]>
}
