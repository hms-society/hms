export const FormalizationSignatureProviderItemStatus = {
  pending: 'pending',
  completed: 'completed',
  rejected: 'rejected',
  cancelled: 'cancelled',
  expired: 'expired',
} as const

export type FormalizationSignatureProviderItemStatus =
  (typeof FormalizationSignatureProviderItemStatus)[keyof typeof FormalizationSignatureProviderItemStatus]
