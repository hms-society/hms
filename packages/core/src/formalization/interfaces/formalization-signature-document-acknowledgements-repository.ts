import type { FormalizationSignatureDocumentAcknowledgement } from '../domain/entities'

export interface FormalizationSignatureDocumentAcknowledgementsRepository {
  add(acknowledgement: FormalizationSignatureDocumentAcknowledgement): Promise<void>
  findByRecipientDocumentAndSnapshot(input: {
    recipientId: string
    requestDocumentId: string
    snapshotId: string
  }): Promise<FormalizationSignatureDocumentAcknowledgement | null>
  listByRecipientAndSnapshot(input: {
    recipientId: string
    snapshotId: string
  }): Promise<FormalizationSignatureDocumentAcknowledgement[]>
}
