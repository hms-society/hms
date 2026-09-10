export const FormalizationSignatureOtpChallengeStatus = {
  pendingDelivery: 'pending_delivery',
  active: 'active',
  consumed: 'consumed',
  superseded: 'superseded',
  expired: 'expired',
  deliveryFailed: 'delivery_failed',
} as const
export type FormalizationSignatureOtpChallengeStatus =
  (typeof FormalizationSignatureOtpChallengeStatus)[keyof typeof FormalizationSignatureOtpChallengeStatus]
