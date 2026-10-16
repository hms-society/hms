export type ClientDocumentSource =
  | { readonly kind: 'received_file'; readonly fileId: string }
  | {
      readonly kind: 'consultation_version'
      readonly consultationId: string
      readonly documentId: string
      readonly versionId: string
    }
  | {
      readonly kind: 'formalization_signed'
      readonly formalizationId: string
      readonly requestDocumentId: string
      readonly artifactId: string
    }
