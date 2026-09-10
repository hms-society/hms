export const FormalizationSignatureResultStatus = {
  submitted: 'submitted',
  reconciliationPending: 'reconciliation_pending',
  confirmed: 'confirmed',
  rejected: 'rejected',
  cancelled: 'cancelled',
  expired: 'expired',
} as const

export type FormalizationSignatureResultStatus =
  (typeof FormalizationSignatureResultStatus)[keyof typeof FormalizationSignatureResultStatus]
