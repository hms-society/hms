export const FormalizationSignatureDocumentContentKind = {
  original: 'original',
  signed: 'signed',
} as const

export type FormalizationSignatureDocumentContentKind =
  (typeof FormalizationSignatureDocumentContentKind)[keyof typeof FormalizationSignatureDocumentContentKind]
