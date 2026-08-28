export const FormalizationSignaturePreviewFailureCode = {
  DocumentVersionFileUnavailable: 'document_version_file_unavailable',
  ConversionRejected: 'conversion_rejected',
  ConversionUnavailable: 'conversion_unavailable',
  InvalidPdf: 'invalid_pdf',
  StorageUnavailable: 'storage_unavailable',
} as const

export type FormalizationSignaturePreviewFailureCode =
  (typeof FormalizationSignaturePreviewFailureCode)[keyof typeof FormalizationSignaturePreviewFailureCode]
