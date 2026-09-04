export const FormalizationSignatureChannelKind = { email: 'email' } as const
export type FormalizationSignatureChannelKind =
  (typeof FormalizationSignatureChannelKind)[keyof typeof FormalizationSignatureChannelKind]
