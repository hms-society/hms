export type ConsultationClientDocument = {
  readonly consultationId: string
  readonly clientId: string
  readonly documentId: string
  readonly versionId: string
  readonly name: string
  readonly fileId: string
  readonly storagePath?: string
  readonly mimeType: string
  readonly createdAt: Date
}
