export type FormalizationClientDocument = {
  readonly formalizationId: string
  readonly clientId: string
  readonly documentId: string
  readonly requestDocumentId: string
  readonly artifactId: string
  readonly privateFileId: string
  readonly name: string
  readonly mimeType: string
  readonly sizeBytes: number
  readonly createdAt: Date
}
