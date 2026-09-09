import type { FormalizationSignatureRequestDocument } from '../domain/entities'
import type { FormalizationSignatureRequestDocumentChanges } from '../domain/structures'
export interface FormalizationSignatureRequestDocumentsRepository {
  addMany(
    documents: readonly FormalizationSignatureRequestDocument[],
  ): Promise<FormalizationSignatureRequestDocument[]>
  findById(
    requestDocumentId: string,
  ): Promise<FormalizationSignatureRequestDocument | null>
  listByRequestId(requestId: string): Promise<FormalizationSignatureRequestDocument[]>
  replace(input: {
    requestDocumentId: string
    expectedVersion: number
    changes: FormalizationSignatureRequestDocumentChanges
  }): Promise<boolean>
}
