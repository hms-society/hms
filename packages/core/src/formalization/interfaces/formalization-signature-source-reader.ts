import type {
  FormalizationSignatureCandidatePage,
  FormalizationSignatureSourceDocument,
  FormalizationSignatureSourcePerson,
} from '../domain/structures'

export interface FormalizationSignatureSourceReader {
  findPerson(personId: string): Promise<FormalizationSignatureSourcePerson | null>
  listEligibleCandidates(input: {
    readonly formalizationId: string
    readonly page: number
    readonly limit: number
    readonly search?: string
    readonly excludedPersonIds: readonly string[]
  }): Promise<FormalizationSignatureCandidatePage>
  listCurrentDocuments(
    formalizationId: string,
  ): Promise<ReadonlyArray<FormalizationSignatureSourceDocument>>
  findCurrentDocument(
    formalizationId: string,
    documentId: string,
  ): Promise<FormalizationSignatureSourceDocument | null>
  findDocumentVersion(
    formalizationId: string,
    documentVersionId: string,
  ): Promise<FormalizationSignatureSourceDocument | null>
}
