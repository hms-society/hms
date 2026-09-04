export const FormalizationSignatureRequestStatus = {
  provisioning: 'provisioning', sending: 'sending', sent: 'sent', inProgress: 'in_progress',
  partiallySubmitted: 'partially_submitted', submitted: 'submitted',
  reconciliationRequired: 'reconciliation_required', confirmed: 'confirmed', rejected: 'rejected',
  cancelled: 'cancelled', expired: 'expired', failed: 'failed',
} as const
export type FormalizationSignatureRequestStatus =
  (typeof FormalizationSignatureRequestStatus)[keyof typeof FormalizationSignatureRequestStatus]
