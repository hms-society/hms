export const FormalizationSignatureFieldType = {
  Signature: 'signature',
} as const

export type FormalizationSignatureFieldType =
  (typeof FormalizationSignatureFieldType)[keyof typeof FormalizationSignatureFieldType]
