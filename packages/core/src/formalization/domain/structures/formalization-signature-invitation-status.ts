export const FormalizationSignatureInvitationStatus = {
  active: 'active',
  consumed: 'consumed',
  revoked: 'revoked',
  expired: 'expired',
} as const
export type FormalizationSignatureInvitationStatus =
  (typeof FormalizationSignatureInvitationStatus)[keyof typeof FormalizationSignatureInvitationStatus]
