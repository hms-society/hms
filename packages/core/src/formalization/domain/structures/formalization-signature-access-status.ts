export const FormalizationSignatureAccessStatus = {
  active: 'active', revoked: 'revoked', expired: 'expired',
} as const
export type FormalizationSignatureAccessStatus =
  (typeof FormalizationSignatureAccessStatus)[keyof typeof FormalizationSignatureAccessStatus]
