export const FormalizationSignatureProviderEnvelopeStatus = {
  draft: 'draft',
  pending: 'pending',
  inProgress: 'in_progress',
  completed: 'completed',
  rejected: 'rejected',
  cancelled: 'cancelled',
  expired: 'expired',
} as const

export type FormalizationSignatureProviderEnvelopeStatus =
  (typeof FormalizationSignatureProviderEnvelopeStatus)[keyof typeof FormalizationSignatureProviderEnvelopeStatus]
